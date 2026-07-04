// Ranny's — Astro configuration.
//
// The site is hosted on GitHub Pages as a project page, so it lives under
// /rannys/ (`base`). Internal links in the pages stay relative (./menu.html)
// so a future custom domain only needs `site`/`base` changed here.
// `build.format: 'file'` keeps the original URLs (menu.html, events.html…)
// exactly as they were before the Astro rebuild.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kylelookingaround.github.io',
  base: '/rannys',
  trailingSlash: 'ignore',
  build: { format: 'file' },
  integrations: [
    sitemap({
      // build.format 'file' serves pages as /rannys/menu.html — put that
      // real URL in the sitemap (the integration would otherwise drop it)
      serialize: (item) => {
        const url = new URL(item.url);
        if (url.pathname !== '/rannys' && url.pathname !== '/rannys/' && !url.pathname.endsWith('.html')) {
          item.url = item.url.replace(/\/?$/, '.html');
        }
        return item;
      },
    }),
  ],
});
