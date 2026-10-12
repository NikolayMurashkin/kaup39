import type { ScheduleItem } from '@/cms/types';
import { upcoming } from '@/cms/upcoming';
import { SCHEDULE_PATH } from '@/lib/consts';
import { formatDay, plural } from '@/lib/format';
import { DATES_FORMS } from '../_home/consts';
import { DATES_ANCHOR, EVENTS_FORMS, FILTER_PARAMS } from './consts';
import type { MonthGroup, ScheduleEvent, ScheduleFilters, SeasonFacts } from './types';

const momentOf = ({ date, start }: ScheduleItem) => `${date} ${start}`;

/** Строки расписания: даты, которые еще не прошли, по порядку дня и начала — порядок не зависит от базы. */
export const scheduleRows = (items: ScheduleItem[], now: Date) =>
  upcoming(items, now).sort((a, b) => momentOf(a).localeCompare(momentOf(b)));

/** `YYYY-MM` дня `YYYY-MM-DD`. */
const monthOf = (date: string) => date.slice(0, 7);

const countOf = (count: number, forms: readonly [string, string, string]) => `${count} ${plural(count, forms)}`;

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || null;

export const readFilters = (params: Record<string, string | string[] | undefined>): ScheduleFilters => ({
  month: single(params[FILTER_PARAMS.month]),
  event: single(params[FILTER_PARAMS.event]),
});

export const filterRows = (rows: ScheduleItem[], { month, event }: ScheduleFilters) =>
  rows.filter((row) => (!month || monthOf(row.date) === month) && (!event || row.event.slug === event));

export const monthsOf = (rows: ScheduleItem[]) => [...new Set(rows.map((row) => monthOf(row.date)))];

/** События по первой дате каждого: так же они идут в фильтре и в таблице цен. */
export const eventsOf = (rows: ScheduleItem[]): ScheduleEvent[] => [
  ...new Map(
    rows.map(({ event, tariffs }) => [event.slug, { slug: event.slug, title: event.title, tariffs }] as const),
  ).values(),
];

export const byMonth = (rows: ScheduleItem[]): MonthGroup[] =>
  monthsOf(rows).map((month) => {
    const monthRows = rows.filter((row) => monthOf(row.date) === month);

    return { month, rows: monthRows, count: countOf(monthRows.length, DATES_FORMS) };
  });

/** Адрес расписания с фильтрами; пустой фильтр в адрес не попадает. */
export const filterHref = ({ month, event }: ScheduleFilters) => {
  const params = new URLSearchParams();

  if (month) params.set(FILTER_PARAMS.month, month);
  if (event) params.set(FILTER_PARAMS.event, event);

  const query = params.toString();

  return `${SCHEDULE_PATH}${query ? `?${query}` : ''}#${DATES_ANCHOR}`;
};

/** Факты сезона для первого экрана: сколько дат и событий впереди и когда последний день. Дат нет — фактов нет. */
export const seasonFacts = (rows: ScheduleItem[]): SeasonFacts | null => {
  if (!rows.length) return null;

  const lastDate = rows.reduce((last, { date }) => (date > last ? date : last), rows[0].date);

  return {
    year: Number(lastDate.slice(0, 4)),
    dates: countOf(rows.length, DATES_FORMS),
    last: { dateTime: lastDate, date: formatDay(lastDate) },
    events: countOf(new Set(rows.map((row) => row.event.slug)).size, EVENTS_FORMS),
  };
};
