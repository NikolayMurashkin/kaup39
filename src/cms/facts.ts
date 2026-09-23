import type { EventFact, ScheduleFact } from './types';

/**
 * Факты расписания с исходной страницы `/tur` — ее видимой таблицы. Названия и тексты событий
 * приезжают из файла контента вне git; здесь только то, что сверяет `tests/unit/schedule-facts.test.ts`.
 */
export const EVENT_FACTS: EventFact[] = [
  {
    slug: 'denvikingi',
    ticketUrl:
      'https://radario.ru/customer/afisha/07491522457ccd14ae0cf241ef5615b0c4390638501d5eb?openAsLinkKey=97088c52oc',
    tariffs: [{ kind: 'entry', amount: 700 }],
  },
  {
    slug: 'ragnarek',
    ticketUrl:
      'https://radario.ru/customer/afisha/074915215975c97475971890d47b04876c54c7374cd6fbc?openAsLinkKey=8jtiqyy6un',
    tariffs: [
      { kind: 'adult', amount: 1000 },
      { kind: 'child', amount: 700 },
      { kind: 'family22', amount: 2700 },
      { kind: 'family21', amount: 2300 },
    ],
  },
];

const daytime = (start: string, end: string, dates: string[]): ScheduleFact[] =>
  dates.map((date) => ({ event: 'denvikingi', date, start, end }));

/**
 * Октябрь на `/tur` записан с ошибками: 03.10 стоит в двух строках, а у второй строки время
 * «с 12:00 до 12:00». Здесь 03.10 один раз, с 13:00 до 16:00, а у остальных дат конец в 15:00 —
 * так на странице события `/denvikingi` (решение Николая 23.09.2026).
 */
export const SCHEDULE_FACTS: ScheduleFact[] = [
  ...daytime('15:00', '18:00', ['2026-05-02', '2026-05-10', '2026-05-16', '2026-05-23', '2026-05-30']),
  ...daytime('13:00', '17:00', ['2026-06-03', '2026-06-10', '2026-06-17', '2026-06-24']),
  ...daytime('15:00', '18:00', ['2026-06-06', '2026-06-13', '2026-06-20', '2026-06-27']),
  ...daytime('13:00', '17:00', ['2026-07-01', '2026-07-08', '2026-07-15', '2026-07-22', '2026-07-29']),
  ...daytime('13:00', '17:00', [
    '2026-08-05',
    '2026-08-12',
    '2026-08-15',
    '2026-08-19',
    '2026-08-22',
    '2026-08-26',
    '2026-08-29',
  ]),
  ...daytime('14:00', '18:00', ['2026-08-01']),
  ...daytime('14:00', '17:00', ['2026-09-05', '2026-09-12', '2026-09-19']),
  ...daytime('13:00', '16:00', ['2026-09-26']),
  ...daytime('13:00', '16:00', ['2026-10-03']),
  ...daytime('12:00', '15:00', ['2026-10-10', '2026-10-17', '2026-10-24']),
  { event: 'ragnarek', date: '2026-05-16', start: '19:00', end: '22:00', show: '21:30' },
  { event: 'ragnarek', date: '2026-06-06', start: '19:00', end: '23:00', show: '22:30' },
  { event: 'ragnarek', date: '2026-06-27', start: '19:00', end: '23:00', show: '22:30' },
  { event: 'ragnarek', date: '2026-07-25', start: '19:00', end: '23:00', show: '22:30' },
  { event: 'ragnarek', date: '2026-08-22', start: '18:00', end: '22:00', show: '21:30' },
  { event: 'ragnarek', date: '2026-09-12', start: '18:00', end: '21:00', show: '20:30' },
  { event: 'ragnarek', date: '2026-10-10', start: '16:00', end: '19:00', show: '18:30' },
];
