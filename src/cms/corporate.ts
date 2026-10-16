import config from '@payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';
import type { CorporatePageData } from './types';

/**
 * Все, что нужно странице корпоративов: ее разделы с раскрытыми кадрами, контакты владельцев и отзывы гостей.
 * `cache` склеивает вызовы одного запроса: метаданные и страница читают базу один раз; между запросами кеша нет —
 * отзыв, добавленный в админке, виден со следующей загрузки.
 */
export const getCorporatePage = cache(async (): Promise<CorporatePageData> => {
  const payload = await getPayload({ config });
  const [pages, site, reviews] = await Promise.all([
    payload.find({ collection: 'pages', where: { slug: { equals: 'corporate' } }, depth: 1, limit: 1 }),
    payload.findGlobal({ slug: 'site', depth: 0 }),
    payload.find({ collection: 'reviews', sort: '-createdAt', depth: 0, pagination: false }),
  ]);

  return { site, page: pages.docs[0] ?? null, reviews: reviews.docs };
});
