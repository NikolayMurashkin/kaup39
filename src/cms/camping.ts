import config from '@payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';
import type { CampingPageData } from './types';

/**
 * Все, что нужно странице кемпинга: ее разделы с раскрытыми кадрами, кадр шапки и контакты владельцев. `cache`
 * склеивает вызовы одного запроса: метаданные и страница читают базу один раз; между запросами кеша нет.
 */
export const getCampingPage = cache(async (): Promise<CampingPageData> => {
  const payload = await getPayload({ config });
  const [pages, site] = await Promise.all([
    payload.find({ collection: 'pages', where: { slug: { equals: 'camping' } }, depth: 1, limit: 1 }),
    payload.findGlobal({ slug: 'site', depth: 0 }),
  ]);

  return { site, page: pages.docs[0] ?? null };
});
