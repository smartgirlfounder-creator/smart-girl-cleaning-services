import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Change this once the domain is connected in Netlify.
export default defineConfig({
  site: 'https://kaffyolaitan.com',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/thank-you') })],
});
