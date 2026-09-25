import { MONTHS_GENITIVE, WEEKDAYS } from '../../src/lib/consts';
import { formatAmount } from '../../src/lib/format';
import { DIRECTIONS, EVENTS, HOME, TAVERNS } from '../e2e/seed/data';

export type ArtboardText = {
  /** SHA-256 файла артборда, с которого снят текст: по нему видно, что снимок устарел. */
  sha256: string;
  /** Текст артборда по гарнитурам, с учетом `text-transform`, без таблицы токенов и панели переключателей. */
  texts: Record<string, string>;
};

export type ReferenceText = {
  kind: string;
  text: string;
};

/** Гарнитура капители: Forum набирает только заглавными, и тексты для нее берутся в верхнем регистре. */
export const CAPS_FAMILY = 'Forum';

/**
 * Гарнитуры, которыми на страницах набраны суммы: Ponomar — цены в плашках и таблицах, Golos Text —
 * «700 ₽» в ленте дат. Forum сумм не набирает, а его нули заметно шире остальных цифр, поэтому суммы
 * в его сверку не входят.
 */
export const PRICE_FAMILIES = ['Ponomar', 'Golos Text'];

/** Все числа месяца, месяцы в родительном падеже и дни недели — словами форматтера дат. */
export const DATE_SET = [
  ...Array.from({ length: 31 }, (_, index) => String(index + 1)),
  ...MONTHS_GENITIVE,
  ...WEEKDAYS,
].join(' ');

const AMOUNT_KEYS = new Set(['amount', 'price', 'priceTo']);

const amountsOf = (value: unknown): number[] => {
  if (Array.isArray(value)) return value.flatMap(amountsOf);
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, item]) =>
    AMOUNT_KEYS.has(key) && typeof item === 'number' ? [item] : amountsOf(item),
  );
};

/** Суммы засева так, как их печатает страница: каждая — отдельный узел, пробелов между ними нет. */
export const SEED_PRICES = amountsOf([EVENTS, HOME, DIRECTIONS, TAVERNS]).map(formatAmount).join('');

/** Тексты, на которых запасное начертание гарнитуры обязано держать ширину и высоту настоящего шрифта. */
export const referenceTexts = (family: string, artboard: Record<string, string>): ReferenceText[] => {
  const cased = (text: string) => (family === CAPS_FAMILY ? text.toUpperCase() : text);

  return [
    { kind: 'artboard', text: artboard[family] ?? '' },
    { kind: 'dates', text: cased(DATE_SET) },
    ...(PRICE_FAMILIES.includes(family) ? [{ kind: 'prices', text: SEED_PRICES }] : []),
  ];
};
