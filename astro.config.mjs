import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://livefonty.de',
  integrations: [sitemap()],
});
