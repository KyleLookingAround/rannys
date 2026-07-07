// Ranny's — Astro configuration.
//
// The site is served from its own domain (rannys.co.uk via public/CNAME), so
// there is no `base` path — asset/script URLs resolve at the domain root.
// Internal links in the pages are relative (./menu.html).
// `build.format: 'file'` keeps the original URLs (menu.html, events.html…)
// exactly as they were before the Astro rebuild.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rannys.co.uk',
  trailingSlash: 'ignore',
  build: { format: 'file' },
  integrations: [
    sitemap({
      // build.format 'file' serves pages as /menu.html — put that real URL
      // in the sitemap (the integration would otherwise drop the extension)
      serialize: (item) => {
        const url = new URL(item.url);
        if (url.pathname !== '/' && !url.pathname.endsWith('.html')) {
          item.url = item.url.replace(/\/?$/, '.html');
        }
        return item;
      },
    }),
  ],
});
