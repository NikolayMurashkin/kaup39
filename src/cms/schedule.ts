import config from '@payload-config';
import { getPayload } from 'payload';
import type { Schedule } from '@/payload-types';
import { SETTLEMENT_TIME_ZONE } from './consts';
import type { ScheduleItem } from './types';

/** `en-CA` печатает дату как `YYYY-MM-DD`. */
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: SETTLEMENT_TIME_ZONE });

const toItem = ({ id, date, start, end, show, event }: Schedule): ScheduleItem[] =>
  typeof event === 'object'
    ? [
        {
          id,
          date: dayFormat.format(new Date(date)),
          start,
          end,
          show: show ?? null,
          event: { slug: event.slug, title: event.title, ticketUrl: event.ticketUrl },
          tariffs: event.tariffs.map(({ kind, amount }) => ({ kind, amount })),
        },
      ]
    : [];

/**
 * Все даты расписания по порядку, с событием и его ценами. Кеша нет: страницы рендерятся на каждый
 * запрос (layout читает куку темы), и дата, поправленная в админке, видна со следующей загрузки.
 */
export const getSchedule = async (): Promise<ScheduleItem[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: 'schedule',
    depth: 1,
    pagination: false,
    sort: ['date', 'start'],
  });

  return docs.flatMap(toItem);
};
