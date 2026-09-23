import { describe, expect, it } from 'vitest';
import { EVENT_FACTS, SCHEDULE_FACTS } from '@/cms/facts';
import type { ScheduleFact } from '@/cms/types';
import { turDayRows, turEveningRows, turIsReachable, turPriceTexts, type TurDayRow } from '../lib/tur';

/** Цены из таблицы `/tur` — те, что названы в критерии блока. */
const TUR_TARIFFS = [
  { slug: 'denvikingi', tariffs: [{ kind: 'entry', amount: 700 }] },
  {
    slug: 'ragnarek',
    tariffs: [
      { kind: 'adult', amount: 1000 },
      { kind: 'child', amount: 700 },
      { kind: 'family22', amount: 2700 },
      { kind: 'family21', amount: 2300 },
    ],
  },
];

/** Видимая сетка дневного события на `/tur`, дословно: заголовок месяца и строка дней под ним. */
const TUR_DAY_ROWS: TurDayRow[] = [
  { header: 'МАЙ с 15:00 до 18:00', days: '02; 10; 16; 23; 30' },
  { header: 'ИЮНЬ С 13:00 ДО 17:00', days: '03; 10; 17; 24' },
  { header: 'ИЮНЬ С 15:00 ДО 18:00', days: '06; 13; 20; 27' },
  { header: 'ИЮЛЬ С 13:00 ДО 17:00', days: '01; 08; 15; 22; 29' },
  { header: 'АВГУСТ С 13:00 ДО 17:00', days: '05; 12; 15; 19; 22; 26; 29' },
  { header: 'АВГУСТ С 14:00 ДО 18:00', days: '01' },
  { header: 'СЕНТЯБРЬ С 14:00 ДО 17:00', days: '05; 12; 19' },
  { header: 'СЕНТЯБРЬ С 13:00 ДО 16:00', days: '26' },
  { header: 'ОКТЯБРЬ С 13:00 ДО 16:00', days: '03' },
  { header: 'ОКТЯБРЬ С 12:00 ДО 12:00', days: '03; 10; 17; 24' },
];

/** Видимый список дат вечернего события на `/tur`, дословно. */
const TUR_EVENING_ROWS = [
  '16.05.26 с 19:00 до 22:00 шоу 21:30',
  '06.06.26 с 19:00 до 23:00 шоу 22:30',
  '27.06.26 с 19:00 до 23:00 шоу 22:30',
  '25.07.26 с 19:00 до 23:00 шоу 22:30',
  '22.08.26 с 18:00 до 22:00 шоу 21:30',
  '12.09.26 с 18:00 до 21:00 шоу 20:30',
  '10.10.26 с 16:00 до 19:00 шоу 18:30',
];

/**
 * Две правки таблицы по странице события `/denvikingi` (решение Николая 23.09.2026): в октябре `/tur`
 * ставит 03.10 в обе строки, а у второй строки время «с 12:00 до 12:00».
 */
const CORRECTIONS: { from: string; to: string | null }[] = [
  { from: 'denvikingi 2026-10-03 12:00–12:00', to: null },
  { from: 'denvikingi 2026-10-10 12:00–12:00', to: 'denvikingi 2026-10-10 12:00–15:00' },
  { from: 'denvikingi 2026-10-17 12:00–12:00', to: 'denvikingi 2026-10-17 12:00–15:00' },
  { from: 'denvikingi 2026-10-24 12:00–12:00', to: 'denvikingi 2026-10-24 12:00–15:00' },
];

/** Год на `/tur` написан только у вечерних дат; сетка дневного — тот же сезон 2026. */
const DAY_ROWS_YEAR = 2026;

const MONTHS = ['май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь'];

const formatFact = ({ event, date, start, end, show }: ScheduleFact) =>
  `${event} ${date} ${start}–${end}${show ? ` шоу ${show}` : ''}`;

const dayRowLines = ({ header, days }: TurDayRow) => {
  const [, month, start, end] = /^(\S+) с (\d\d:\d\d) до (\d\d:\d\d)$/i.exec(header) ?? [];
  const monthNumber = String(MONTHS.indexOf(month.toLocaleLowerCase('ru')) + 5).padStart(2, '0');

  return days.split('; ').map((day) => `denvikingi ${DAY_ROWS_YEAR}-${monthNumber}-${day} ${start}–${end}`);
};

const eveningRowLine = (row: string) => {
  const [, day, month, year, start, end, show] =
    /^(\d\d)\.(\d\d)\.(\d\d) с (\d\d:\d\d) до (\d\d:\d\d) шоу (\d\d:\d\d)$/.exec(row) ?? [];

  return `ragnarek 20${year}-${month}-${day} ${start}–${end} шоу ${show}`;
};

const correct = (lines: string[]) =>
  CORRECTIONS.reduce((result, { from, to }) => {
    expect(
      result.filter((line) => line === from),
      `правка «${from}» устарела`,
    ).toHaveLength(1);

    return to === null ? result.filter((line) => line !== from) : result.map((line) => (line === from ? to : line));
  }, lines);

const expectedLines = () =>
  correct([...TUR_DAY_ROWS.flatMap(dayRowLines), ...TUR_EVENING_ROWS.map(eveningRowLine)]).sort();

const parseTariffText = (text: string) =>
  [...text.matchAll(/(Взрослый|Детский|Семейный \(2\+2\)|Семейный \(2\+1\)):? (\d+)/g)].map(([, label, amount]) => ({
    kind: { Взрослый: 'adult', Детский: 'child', 'Семейный (2+2)': 'family22', 'Семейный (2+1)': 'family21' }[label],
    amount: Number(amount),
  }));

describe('сиды расписания совпадают с таблицей /tur', () => {
  it('цены: denvikingi 700 ₽, ragnarek 1000 / 700 / 2700 (2+2) / 2300 (2+1)', () => {
    expect(EVENT_FACTS.map(({ slug, tariffs }) => ({ slug, tariffs }))).toEqual(TUR_TARIFFS);
  });

  it('даты и время: каждая строка таблицы, с двумя правками по /denvikingi', () => {
    expect(SCHEDULE_FACTS.map(formatFact).sort()).toEqual(expectedLines());
  });

  it('slug событий не повторяются, и у каждой даты есть событие в сидах', () => {
    const slugs = EVENT_FACTS.map((fact) => fact.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(SCHEDULE_FACTS.filter((fact) => !slugs.includes(fact.event))).toEqual([]);
  });

  it('таблица теста совпадает с выгрузкой /tur (на CI выгрузки нет — сверка идет на маке)', () => {
    expect(TUR_DAY_ROWS).toHaveLength(10);
    expect(TUR_EVENING_ROWS).toHaveLength(7);

    if (!turIsReachable()) return;

    const sortRows = (rows: TurDayRow[]) => [...rows].sort((a, b) => a.header.localeCompare(b.header, 'ru'));

    expect(sortRows(turDayRows())).toEqual(sortRows(TUR_DAY_ROWS));
    expect(turEveningRows()).toEqual(TUR_EVENING_ROWS);

    const prices = turPriceTexts();

    expect(prices.denvikingi.map((text) => ({ kind: 'entry', amount: parseInt(text, 10) }))).toEqual(
      TUR_TARIFFS[0].tariffs,
    );
    expect(prices.ragnarek.map(parseTariffText)).toEqual([TUR_TARIFFS[1].tariffs]);
  });
});
