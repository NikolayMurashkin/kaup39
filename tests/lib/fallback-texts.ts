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

export type CollectOptions = {
  /** Части, текст которых не берется: на артборде — таблица токенов и панель переключателей. */
  skip: string | null;
  /** На странице берется только нарисованный текст, без дат и без длинного слова засева. */
  onPage: boolean;
  stress: string;
};

/** Цифры запасного шрифта расходятся с цифрами гарнитур сильнее букв, поэтому у них свое начертание. */
export const DIGITS_RANGE = 'U+30-39';

/** Гарнитура капители: Forum набирает только заглавными, и тексты для нее берутся в верхнем регистре. */
const CAPS_FAMILY = 'Forum';

/**
 * Гарнитуры, которыми на страницах набраны суммы: Ponomar — цены в плашках и таблицах, Golos Text —
 * «700 ₽» в ленте дат. Forum сумм не набирает, а его нули заметно шире остальных цифр, поэтому суммы
 * в его сверку не входят (решение Николая 25.09.2026).
 */
const PRICE_FAMILIES = ['Ponomar', 'Golos Text'];

const DAY_NUMBERS = Array.from({ length: 31 }, (_, index) => String(index + 1));

/** Все числа месяца, месяцы в родительном падеже и дни недели — словами форматтера дат. */
const DATE_SET = [...DAY_NUMBERS, ...MONTHS_GENITIVE, ...WEEKDAYS].join(' ');

const AMOUNT_KEYS = new Set(['amount', 'price', 'priceTo']);

const amountsOf = (value: unknown): number[] => {
  if (Array.isArray(value)) return value.flatMap(amountsOf);
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, item]) =>
    AMOUNT_KEYS.has(key) && typeof item === 'number' ? [item] : amountsOf(item),
  );
};

/** Суммы засева так, как их печатает страница: каждая — отдельный узел, пробелов между ними нет. */
const SEED_PRICES = amountsOf([EVENTS, HOME, DIRECTIONS, TAVERNS]).map(formatAmount).join('');

/**
 * Тексты, на которых запасное начертание гарнитуры обязано держать ширину и высоту настоящего шрифта.
 * У каждой гарнитуры есть текст из одних цифр: без него подгонка вольна увести `size-adjust` цифр куда
 * угодно, лишь бы уравновесить буквенные тексты (у Forum цифры так ушли на 7%). У гарнитур с суммами это
 * суммы засева, у Forum — числа месяца подряд, без пробелов: пробел запасного шрифта шире или уже пробела
 * гарнитуры и на тексте из коротких чисел перевешивал сами цифры. Числа месяца и суммы вместе одному
 * `size-adjust` не даются: у Golos Text цифры пропорциональные, единица узкая, ноль широкий, а у Arial
 * все цифры одной ширины — на числах выходило 1,028, на суммах 0,972.
 */
export const referenceTexts = (family: string, artboard: Record<string, string>): ReferenceText[] => {
  const cased = (text: string) => (family === CAPS_FAMILY ? text.toUpperCase() : text);

  return [
    { kind: 'artboard', text: artboard[family] ?? '' },
    { kind: 'dates', text: cased(DATE_SET) },
    PRICE_FAMILIES.includes(family)
      ? { kind: 'prices', text: SEED_PRICES }
      : { kind: 'numbers', text: DAY_NUMBERS.join('') },
  ];
};

/**
 * Текст узлов по первому семейству их `font-family`, с учетом `text-transform`. Функция уходит
 * в `page.evaluate` целиком, поэтому ни на что снаружи не ссылается.
 *
 * На странице берется только нарисованный текст. Узлы с длинным словом засева не входят: это нагрузка
 * для теста переносов, а не текст — одно слово заглавными из восьмидесяти букв занимало треть текста
 * Ponomar на главной засева. Даты (`<time>`) не входят тоже: засев ставит их от сегодняшнего дня, и с ними
 * сверка на CI краснела или зеленела по дням (1,0199 для 24.09 и 1,0213 для 25.09 на одной сборке);
 * все даты целиком меряются отдельно, в эталонных текстах.
 */
export const collectTexts = ({ skip, onPage, stress }: CollectOptions) => {
  const texts: Record<string, string> = {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const host = node.parentElement;

    if (!host || !node.nodeValue?.trim() || (skip && host.closest(skip))) continue;

    if (onPage) {
      if (node.nodeValue.includes(stress) || host.closest('time')) continue;
      if (!host.checkVisibility({ visibilityProperty: true })) continue;

      const range = document.createRange();

      range.selectNodeContents(node);

      if (![...range.getClientRects()].some((rect) => rect.width > 1 && rect.height > 1)) continue;
    }

    const style = getComputedStyle(host);
    const family = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    const text = node.nodeValue.replace(/\s+/g, ' ');

    texts[family] = (texts[family] ?? '') + (style.textTransform === 'uppercase' ? text.toUpperCase() : text);
  }

  return texts;
};
