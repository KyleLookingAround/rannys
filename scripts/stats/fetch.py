"""Pull Ranny's visitor stats from GoatCounter, one row set per stats month.

A stats month runs from the 4th to the 3rd (tracking began on 4 October 2026),
so "October" is 4 Oct - 3 Nov. Every completed month is fetched, plus the
current month so far when it has at least one full day. Each output file holds
every month, tagged with a `month` column (e.g. "2026-10"), so the dashboard
can flick between them.

Needs no API key in the code: in the cloud environment the network proxy
adds it for rannys.goatcounter.com. Elsewhere, set GOATCOUNTER_TOKEN.

    python3 scripts/stats/fetch.py OUT_DIR [--today YYYY-MM-DD]
"""
import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.request

API = 'https://rannys.goatcounter.com/api/v0'
FIRST_DAY = dt.date(2026, 10, 4)

PAGE_NAMES = {'/': 'Home', '/menu.html': 'Menu', '/photos.html': 'Photos',
              '/events.html': "What's on", '/bookings.html': 'Bookings'}

# event path prefix -> (type shown on the dashboard, kind)
EVENT_TYPES = {
    'menu-photo': ('Menu photos', 'Photo view'),
    'photo': ('Gallery photos', 'Photo view'),
    'directions': ('Get directions', 'Action'),
    'social': ('Instagram & Facebook', 'Action'),
    'tickets': ('Event tickets', 'Action'),
    'email': ('Email us', 'Action'),
    'partner': ('Suppliers & makers', 'Action'),
    'join-list': ('Join the list', 'Action'),
    'booking-enquiry': ('Booking form sent', 'Action'),
}

REFERRERS = {'ig': 'Instagram', 'l.instagram.com': 'Instagram', 'instagram.com': 'Instagram',
             'www.instagram.com': 'Instagram', '': 'Direct or unknown',
             'www.facebook.com': 'Facebook', 'm.facebook.com': 'Facebook', 'l.facebook.com': 'Facebook',
             'chatgpt.com': 'ChatGPT'}

SIZES = {'phone': 'Phone', 'largephone': 'Phone', 'tablet': 'Tablet', 'desktop': 'Desktop', 'desktophd': 'Desktop'}


def get(path):
    """GET an API path, retrying the proxy's occasional 502s."""
    headers = {'Accept': 'application/json'}
    if os.environ.get('GOATCOUNTER_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['GOATCOUNTER_TOKEN']
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + path, headers=headers), timeout=60) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001 - network errors and 5xx alike
            if attempt == 5:
                sys.exit(f'GoatCounter request failed: {path}: {e}')
            time.sleep(2 ** attempt)
        finally:
            time.sleep(0.3)  # stay well inside the API rate limit


def add_month(d):
    return dt.date(d.year + (d.month == 12), d.month % 12 + 1, d.day)


def months(today):
    """(id, start, end, complete) for each month with at least one full day before today."""
    out, start = [], FIRST_DAY
    while start < today:
        nxt = add_month(start)
        end = min(nxt - dt.timedelta(days=1), today - dt.timedelta(days=1))
        out.append((start.strftime('%Y-%m'), start, end, end == nxt - dt.timedelta(days=1)))
        start = nxt
    return out


def label(start, end):
    a = f'{start.day} {start:%b}' + (f' {start.year}' if start.year != end.year else '')
    return f'{a} – {end.day} {end:%b} {end.year}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--today', type=dt.date.fromisoformat, default=dt.date.today())
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    files = {k: [] for k in ('periods', 'totals', 'daily', 'pages', 'clicks', 'sources', 'audience')}
    for month, start, end, complete in months(a.today):
        q = f'start={start}&end={end + dt.timedelta(days=1)}'  # the API's end date is exclusive
        name = dt.date(start.year, start.month, 1).strftime('%B %Y')
        files['periods'].append({'month': month, 'name': name, 'label': label(start, end),
                                 'start': str(start), 'end': str(end), 'days': (end - start).days + 1,
                                 'complete': complete, 'pdf': ''})

        t = get(f'/stats/total?{q}')
        files['totals'] += [{'month': month, 'metric': 'visits', 'value': t['total']},
                            {'month': month, 'metric': 'clicks', 'value': t['total_events']}]
        files['daily'] += [{'month': month, 'day': d['day'], 'visits': d['daily']}
                           for d in t['stats'] if start <= dt.date.fromisoformat(d['day']) <= end]

        for h in get(f'/stats/hits?{q}&limit=100')['hits']:
            if not h['event']:
                files['pages'].append({'month': month, 'page': PAGE_NAMES.get(h['path'], h['path']),
                                       'path': h['path'], 'visits': h['count']})
                continue
            group, kind = EVENT_TYPES.get(h['path'].split('/')[0], ('Other', 'Action'))
            title = h.get('title') or h['path']
            item = title.split(': ', 1)[1] if ': ' in title else title
            files['clicks'].append({'month': month, 'kind': kind, 'group': group, 'item': item[:70],
                                    'path': h['path'], 'clicks': h['count']})

        src = {}
        for s in get(f'/stats/toprefs?{q}&limit=50')['stats']:
            n = s.get('name') or ''
            if 'rannys.co.uk' in n or 'kylelookingaround.github.io' in n:
                continue  # moves between the site's own pages
            k = REFERRERS.get(n, n)
            src[k] = src.get(k, 0) + s['count']
        files['sources'] += sorted(({'month': month, 'source': k, 'visits': v} for k, v in src.items()),
                                   key=lambda r: -r['visits'])

        dev = {}
        for s in get(f'/stats/sizes?{q}')['stats']:
            if s.get('id') in SIZES and s['count']:
                dev[SIZES[s['id']]] = dev.get(SIZES[s['id']], 0) + s['count']
        files['audience'] += [{'month': month, 'dimension': 'Device', 'name': k, 'visits': v} for k, v in dev.items()]
        files['audience'] += [{'month': month, 'dimension': 'System', 'name': s['name'] or 'Unknown', 'visits': s['count']}
                              for s in get(f'/stats/systems?{q}&limit=6')['stats'] if s['count']]
        loc = [s for s in get(f'/stats/locations?{q}&limit=50')['stats'] if s['count']]
        files['audience'] += [{'month': month, 'dimension': 'Country', 'name': s['name'] or 'Unknown', 'visits': s['count']}
                              for s in loc[:4]]
        if loc[4:]:
            files['audience'].append({'month': month, 'dimension': 'Country', 'name': 'Elsewhere',
                                      'visits': sum(s['count'] for s in loc[4:])})

    for k, rows in files.items():
        with open(os.path.join(a.out, k + '.json'), 'w') as f:
            json.dump(rows, f, indent=1, ensure_ascii=False)
    print('months:', ', '.join(f"{p['month']} ({p['label']}{'' if p['complete'] else ', so far'})" for p in files['periods']))


if __name__ == '__main__':
    main()
