import config from '@payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';
import type { DirectionsPageData } from './types';

/**
 * Все, что нужно странице «как доехать»: ее разделы из CMS, адрес и точка на карте. `cache` склеивает вызовы
 * одного запроса: метаданные и страница читают базу один раз.
 */
export const getDirectionsPage = cache(async (): Promise<DirectionsPageData> => {
  const payload = await getPayload({ config });
  const [pages, site] = await Promise.all([
    payload.find({ collection: 'pages', where: { slug: { equals: 'directions' } }, depth: 1, limit: 1 }),
    payload.findGlobal({ slug: 'site', depth: 0 }),
  ]);

  return { site, page: pages.docs[0] ?? null };
});
