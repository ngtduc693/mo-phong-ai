import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mophongai.io.vn',
  compressHTML: true,
  build: { inlineStylesheets: 'auto' },
  vite: { build: { target: 'es2022' } },
});
