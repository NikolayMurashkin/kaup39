import { describe, expect, it } from 'vitest';
import { scheduleRows } from '@/app/(site)/_schedule/rows';
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
