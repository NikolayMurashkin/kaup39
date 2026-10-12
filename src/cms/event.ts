import config from '@payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';
import { toItem } from './schedule';
import type { EventPageData } from './types';

/**
 * Страница события: событие по slug с раскрытой галереей, все его даты по порядку дня и начала (прошедшие тоже —
 * какие показывать, решает страница) и глобал «Сайт». Нет такого события — `null`. Кеша нет, как у `getSchedule`:
 * адрес кассы, поправленный в админке, виден со следующей загрузки; `cache` склеивает вызовы одного запроса —
 * метаданные и страница читают базу один раз.
 */
export const getEventPage = cache(async (slug: string): Promise<EventPageData | null> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({ collection: 'events', where: { slug: { equals: slug } }, depth: 1, limit: 1 });
  const [event] = docs;

  if (!event) {
    return null;
  }

  const [schedule, site] = await Promise.all([
    payload.find({
      collection: 'schedule',
      where: { event: { equals: event.id } },
      depth: 1,
      pagination: false,
      sort: ['date', 'start'],
    }),
    payload.findGlobal({ slug: 'site', depth: 0 }),
  ]);

  return { event, dates: schedule.docs.flatMap(toItem), site };
});
