import type { APIRoute } from 'astro';
import { WORLD1 } from '../levels/world1';
import { implementedLevelIds } from '../levels/registry';

/** Sinh /sitemap.xml tĩnh từ danh sách màn đã triển khai. */
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://mophongai.io.vn');
  const paths = ['/', '/lo-trinh/', '/giao-vien/', '/chinh-sach-quyen-rieng-tu/'];
  for (const level of WORLD1) {
    if (implementedLevelIds.includes(level.id)) paths.push(`/thuat-toan/${level.slug}/`);
  }

  const urls = paths
    .map((path) => `  <url>\n    <loc>${new URL(path, base).toString()}</loc>\n    <changefreq>monthly</changefreq>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
