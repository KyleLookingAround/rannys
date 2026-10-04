/**
 * Collage layout for the Photos page.
 *
 * Photos are packed into "blocks" of big (2×2), tall (1×2) and small (1×1)
 * tiles that always fill a complete rectangle, so the collage never has holes,
 * whatever number of photos the owner adds. Phones use 2 columns, wider screens
 * 4. Each photo gets an explicit grid-area for both, as CSS custom properties.
 */

type Slot = { r: number; c: number; rs: number; cs: number; kind: 'big' | 'tall' | 'small' | 'solo' };
type Block = { rows: number; slots: Slot[] };

const S = (r: number, c: number, rs: number, cs: number, kind: Slot['kind']): Slot => ({ r, c, rs, cs, kind });

// 2 columns (phones)
const PHONE: Record<string, Block> = {
  big:   { rows: 2, slots: [S(1, 1, 2, 2, 'big')] },
  tallL: { rows: 2, slots: [S(1, 1, 2, 1, 'tall'), S(1, 2, 1, 1, 'small'), S(2, 2, 1, 1, 'small')] },
  pair:  { rows: 2, slots: [S(1, 1, 2, 1, 'tall'), S(1, 2, 2, 1, 'tall')] },
  tallR: { rows: 2, slots: [S(1, 1, 1, 1, 'small'), S(2, 1, 1, 1, 'small'), S(1, 2, 2, 1, 'tall')] },
};
const PHONE_CYCLE = ['big', 'tallL', 'pair', 'tallR'];

// 4 columns (tablets and up)
const WIDE: Record<string, Block> = {
  P:    { rows: 2, slots: [S(1, 1, 2, 2, 'big'), S(1, 3, 2, 1, 'tall'), S(1, 4, 1, 1, 'small'), S(2, 4, 1, 1, 'small')] },
  U:    { rows: 2, slots: [S(1, 1, 2, 1, 'tall'), S(1, 2, 2, 2, 'big'), S(1, 4, 2, 1, 'tall')] },
  Q:    { rows: 2, slots: [S(1, 1, 1, 1, 'small'), S(2, 1, 1, 1, 'small'), S(1, 2, 2, 1, 'tall'), S(1, 3, 2, 2, 'big')] },
  T:    { rows: 2, slots: [S(1, 1, 2, 2, 'big'), S(1, 3, 2, 2, 'big')] },
  solo: { rows: 2, slots: [S(1, 1, 2, 4, 'solo')] },
};
const WIDE_CYCLE = ['P', 'U', 'Q', 'T'];

/** Pick blocks from the cycle, never leaving a remainder no block can fill. */
function plan(n: number, blocks: Record<string, Block>, cycle: string[], fits: (left: number) => boolean): string[] {
  const out: string[] = [];
  let left = n;
  let i = 0;
  const size = (k: string) => blocks[k].slots.length;
  while (left > 0) {
    const pref = cycle[i % cycle.length];
    const prev = out[out.length - 1];
    // a block that uses up exactly what's left finishes the collage neatly
    const exact = Object.keys(blocks).filter((k) => size(k) === left);
    const finish = exact.includes(pref) ? pref : exact.find((k) => k !== prev) ?? exact[0];
    const options = [pref, ...Object.keys(blocks).filter((k) => k !== pref && k !== prev), prev].filter(Boolean) as string[];
    const pick = finish ?? options.find((k) => size(k) <= left && fits(left - size(k)));
    if (!pick) break;
    out.push(pick);
    left -= size(pick);
    i++;
  }
  return out;
}

/**
 * Place photos into a layout. Within each block, the most upright photos take
 * the tall tiles so wide photos aren't cropped to a sliver.
 */
function place(ratios: number[], blocks: Record<string, Block>, order: string[]): string[] {
  const areas = new Array<string>(ratios.length);
  let next = 0;
  let row = 1;
  for (const key of order) {
    const b = blocks[key];
    const idx = Array.from({ length: b.slots.length }, (_, k) => next + k);
    const byUpright = [...idx].sort((a, z) => ratios[a] - ratios[z]);
    const tallSlots = b.slots.filter((sl) => sl.kind === 'tall');
    const otherSlots = b.slots.filter((sl) => sl.kind !== 'tall');
    const assigned = new Map<Slot, number>();
    tallSlots.forEach((sl, k) => assigned.set(sl, byUpright[k]));
    const rest = idx.filter((p) => ![...assigned.values()].includes(p));
    otherSlots.forEach((sl, k) => assigned.set(sl, rest[k]));
    for (const [sl, p] of assigned) {
      areas[p] = `${row + sl.r - 1} / ${sl.c} / span ${sl.rs} / span ${sl.cs}`;
    }
    next += b.slots.length;
    row += b.rows;
  }
  return areas;
}

/** grid-area strings for each photo: [phone, wide] */
export function collage(ratios: number[]): { phone: string; wide: string; big: boolean }[] {
  const n = ratios.length;
  const phoneOrder = plan(n, PHONE, PHONE_CYCLE, () => true); // sizes 1–3 can finish any count
  const wideOrder = n === 1 ? ['solo'] : plan(n, { P: WIDE.P, U: WIDE.U, Q: WIDE.Q, T: WIDE.T }, WIDE_CYCLE, (left) => left !== 1);
  const phone = place(ratios, PHONE, phoneOrder);
  const wide = place(ratios, WIDE, wideOrder);
  return ratios.map((_, i) => ({ phone: phone[i], wide: wide[i], big: /span 2 \/ span 2|span 4/.test(wide[i]) }));
}
