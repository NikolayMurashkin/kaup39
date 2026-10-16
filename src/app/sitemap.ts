import type { MetadataRoute } from 'next';
import { OWNERS_ORIGIN, SITE_PAGES } from '@/lib/consts';

/**
 * Главная и шесть страниц демо на домене владельцев. Служебные адреса (политика ПД, витрина, админка) в карту не
 * входят, окружение стенда ее не меняет: стенд закрыт от индексации в robots.txt.
 */
const sitemap = (): MetadataRoute.Sitemap =>
  ['/', ...SITE_PAGES.map((page) => page.href)].map((pathname) => ({ url: new URL(pathname, OWNERS_ORIGIN).href }));

export default sitemap;
