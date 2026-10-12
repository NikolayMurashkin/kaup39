import type { ScheduleItem } from '@/cms/types';
import type { FirstScreenNext, FirstScreenSeasonClosed } from '@/components/FirstScreen/types';
import { cheapest, cheapestTariff } from '@/lib/events';
import { formatDay, formatWeekday } from '@/lib/format';
import type { Event } from '@/payload-types';
import { EVENT_KIND, NO_DATES_LABEL } from './consts';

/** «12:00 — 15:00»: время даты без шоу — шоу у строки даты идет своей строкой. Тире не уходит в начало строки. */
export const timeRange = ({ start, end }: Pick<ScheduleItem, 'start' | 'end'>) => `${start}\u00a0— ${end}`;

/** Строка над заголовком первого экрана: «событие · 6+». */
export const eventKind = ({ ageRating }: Pick<Event, 'ageRating'>) =>
  [EVENT_KIND, ageRating?.trim()].filter(Boolean).join(' · ');

/**
 * Плашка первого экрана: ближайшая дата с ценой и кассой события или, когда будущих дат нет (сезон закрыт), подпись
 * «дат пока нет» и день, когда событие прошло последний раз.
 */
export const heroNext = (
  event: Pick<Event, 'tariffs' | 'ticketUrl'>,
  upcoming: ScheduleItem[],
  last: ScheduleItem | undefined,
): { next: FirstScreenNext | null; seasonClosed?: FirstScreenSeasonClosed } => {
  const [next] = upcoming;

  if (!next) {
    return {
      next: null,
      seasonClosed: {
        label: NO_DATES_LABEL,
        last: last ? { dateTime: last.date, date: formatDay(last.date) } : null,
      },
    };
  }

  return {
    next: {
      dateTime: next.date,
      date: formatDay(next.date),
      details: `${formatWeekday(next.date)}, ${timeRange(next)}`,
      price: cheapestTariff(event).amount,
      pricePrefix: cheapest(event).prefix,
      ticketUrl: event.ticketUrl,
    },
  };
};
