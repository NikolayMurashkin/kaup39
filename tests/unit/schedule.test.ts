import { describe, expect, it } from 'vitest';
import { byMonth, filterRows, scheduleRows, seasonFacts } from '@/app/(site)/_schedule/rows';
import { SCHEDULE_FACTS } from '@/cms/facts';
import type { ScheduleItem } from '@/cms/types';
import { MONTHS_GENITIVE, WEEKDAYS } from '@/lib/consts';
import { formatDate } from '@/lib/format';

/** Единый формат даты на странице расписания: «10 октября, суббота» — число без нуля впереди. */
const DATE_FORMAT = new RegExp(`^([1-9]|[12]\\d|3[01]) (${MONTHS_GENITIVE.join('|')}), (${WEEKDAYS.join('|')})$`);

/**
 * Три вида записи дат на исходной `/tur`: словами — в списке, который Тильда вынесла за артборд, через точки —
 * у вечернего события, числами месяца через точку с запятой под заголовком месяца — у дневного. В CMS даты
 * лежат днями календаря (их так переводит `facts.ts`), а на странице все три вида печатает один форматтер.
 */
const SOURCE_KINDS = [
  { kind: 'словами', source: '27 сентября', days: { '2026-09-27': '27 сентября, воскресенье' } },
  { kind: 'через точки', source: '16.05.26 с 19:00 до 22:00 шоу 21:30', days: { '2026-05-16': '16 мая, суббота' } },
  {
    kind: 'числами месяца',
    source: 'ИЮЛЬ С 13:00 ДО 17:00 — 01; 08; 15; 22; 29',
    days: {
      '2026-07-01': '1 июля, среда',
      '2026-07-08': '8 июля, среда',
      '2026-07-15': '15 июля, среда',
      '2026-07-22': '22 июля, среда',
      '2026-07-29': '29 июля, среда',
    },
  },
];

const item = (id: number, date: string, start: string, end: string): ScheduleItem => ({
  id,
  date,
  start,
  end,
  show: null,
  event: { slug: `event-${id}`, title: `Событие ${id}`, ticketUrl: `https://radario.ru/customer/afisha/${id}` },
  tariffs: [{ kind: 'entry', amount: 700 }],
});

/** 24.09.2026, 12:00 по Калининграду (UTC+2). */
const NOON = new Date('2026-09-24T10:00:00.000Z');

describe('даты на странице расписания', () => {
  it.each(SOURCE_KINDS)('исходник $kind («$source») печатается единым форматом', ({ days }) => {
    for (const [date, text] of Object.entries(days)) {
      expect(formatDate(date)).toBe(text);
      expect(formatDate(date)).toMatch(DATE_FORMAT);
    }
  });

  it('даты исходника через точки и числами месяца — те же дни, что лежат в фактах расписания', () => {
    const facts = new Set(SCHEDULE_FACTS.map((fact) => fact.date));
    const fromTable = SOURCE_KINDS.filter(({ kind }) => kind !== 'словами').flatMap(({ days }) => Object.keys(days));

    expect(fromTable.filter((date) => !facts.has(date))).toEqual([]);
  });

  it('список отсортирован по дате и началу, прошедшие даты и закончившееся сегодня не показываются', () => {
    const items = [
      item(1, '2026-10-10', '16:00', '19:00'),
      item(2, '2026-09-23', '12:00', '15:00'),
      item(3, '2026-10-10', '12:00', '15:00'),
      item(4, '2026-09-24', '09:00', '11:00'),
      item(5, '2026-09-26', '13:00', '16:00'),
      item(6, '2026-09-24', '11:00', '15:00'),
    ];

    expect(scheduleRows(items, NOON).map(({ id }) => id)).toEqual([6, 5, 3, 1]);
  });

  it('пустое расписание и расписание из одних прошедших дат дают пустой список', () => {
    expect(scheduleRows([], NOON)).toEqual([]);
    expect(scheduleRows([item(1, '2026-08-31', '12:00', '15:00')], NOON)).toEqual([]);
  });
});

/** Строка расписания события `slug` в день `date`. */
const dated = (id: number, date: string, slug = `event-${id}`): ScheduleItem => ({
  ...item(id, date, '12:00', '15:00'),
  event: { slug, title: `Событие ${slug}`, ticketUrl: `https://radario.ru/customer/afisha/${slug}` },
});

describe('факты сезона первого экрана расписания', () => {
  it('41 дата у двух событий, последняя 24 октября 2026: год, число дат, последний день и число событий', () => {
    const rows = [
      ...Array.from({ length: 20 }, (_, index) =>
        dated(index + 1, `2026-09-${String(index + 1).padStart(2, '0')}`, 'denvikingi'),
      ),
      ...Array.from({ length: 20 }, (_, index) =>
        dated(index + 21, `2026-10-${String(index + 1).padStart(2, '0')}`, 'ragnarek'),
      ),
      dated(41, '2026-10-24', 'ragnarek'),
    ];

    expect(rows).toHaveLength(41);
    expect(seasonFacts(rows)).toEqual({
      year: 2026,
      dates: '41 дата',
      last: { dateTime: '2026-10-24', date: '24 октября' },
      events: '2 события',
    });
  });

  it.each([
    { count: 1, dates: '1 дата' },
    { count: 2, dates: '2 даты' },
    { count: 5, dates: '5 дат' },
    { count: 11, dates: '11 дат' },
    { count: 21, dates: '21 дата' },
    { count: 22, dates: '22 даты' },
  ])('дат $count — «$dates»', ({ count, dates }) => {
    const rows = Array.from({ length: count }, (_, index) =>
      dated(index + 1, `2026-${index < 12 ? '09' : '10'}-${String((index % 12) + 1).padStart(2, '0')}`, 'denvikingi'),
    );

    expect(seasonFacts(rows)?.dates).toBe(dates);
  });

  it.each([
    { count: 1, events: '1 событие' },
    { count: 3, events: '3 события' },
    { count: 5, events: '5 событий' },
  ])('событий $count — «$events»', ({ count, events }) => {
    const rows = Array.from({ length: count }, (_, index) =>
      dated(index + 1, `2026-10-${String(index + 1).padStart(2, '0')}`),
    );

    expect(seasonFacts(rows)?.events).toBe(events);
  });

  it('строк нет — фактов нет', () => {
    expect(seasonFacts([])).toBeNull();
  });

  it('последняя дата сезона в другом году: год и день берутся у последней даты', () => {
    const rows = [dated(1, '2026-12-31', 'denvikingi'), dated(2, '2027-01-02', 'denvikingi')];

    expect(seasonFacts(rows)).toMatchObject({ year: 2027, last: { dateTime: '2027-01-02', date: '2 января' } });
  });
});

describe('число дат в группах месяцев', () => {
  const rows = [
    dated(1, '2026-09-26', 'denvikingi'),
    dated(2, '2026-09-27', 'ragnarek'),
    dated(3, '2026-09-28', 'denvikingi'),
    dated(4, '2026-10-03', 'denvikingi'),
  ];

  it('сентябрь из трех строк и октябрь из одной — «3 даты» и «1 дата»', () => {
    expect(byMonth(rows).map(({ month, count }) => ({ month, count }))).toEqual([
      { month: '2026-09', count: '3 даты' },
      { month: '2026-10', count: '1 дата' },
    ]);
  });

  it('после фильтра по событию считаются только оставшиеся строки', () => {
    const filtered = filterRows(rows, { month: null, event: 'ragnarek' });

    expect(byMonth(filtered).map(({ month, count }) => ({ month, count }))).toEqual([
      { month: '2026-09', count: '1 дата' },
    ]);
  });
});
