import config from '@payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';
import { getSchedule } from './schedule';
import type { HomeData } from './types';
import { upcoming } from './upcoming';

/**
 * Все, что нужно главной, одним заходом: страница и ее разделы, раздел трансфера со страницы «как доехать»,
 * площадки, таверны, контакты и даты, которые еще не прошли. Кеша нет, как и у `getSchedule`: правка
 * в админке видна со следующей загрузки. `cache` склеивает вызовы одного запроса: метаданные и страница
 * читают базу один раз.
 */
export const getHome = cache(async (now = new Date()): Promise<HomeData> => {
  const payload = await getPayload({ config });
  const [pages, zones, taverns, site, schedule] = await Promise.all([
    payload.find({
      collection: 'pages',
      where: { slug: { in: ['home', 'directions'] } },
      depth: 1,
      pagination: false,
    }),
    payload.find({ collection: 'zones', sort: 'order', depth: 0, pagination: false }),
    payload.find({ collection: 'taverns', sort: 'order', depth: 0, pagination: false }),
    payload.findGlobal({ slug: 'site', depth: 0 }),
    getSchedule(),
  ]);

  return {
    site,
    page: pages.docs.find((page) => page.slug === 'home') ?? null,
    directions: pages.docs.find((page) => page.slug === 'directions') ?? null,
    zones: zones.docs,
    taverns: taverns.docs,
    upcoming: upcoming(schedule, now),
  };
});
