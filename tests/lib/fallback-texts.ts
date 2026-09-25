import { MONTHS_GENITIVE, WEEKDAYS } from '../../src/lib/consts';
import { formatAmount, formatDate } from '../../src/lib/format';
import { DIRECTIONS, EVENTS, HOME, shiftDay, TAVERNS } from '../e2e/seed/data';

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

/**
 * Знаки со своим начертанием у запасного шрифта: `size-adjust` берется по ширине первого из них, остальные
 * той же ширины (пробел и неразрывный пробел).
 */
type GlyphFace = {
  chars: string;
  range: string;
  /** Свои локальные шрифты начертания — у знака, которого нет в шрифтах запасного начертания гарнитуры. */
  locals?: string[];
  /** Насыщенность, которой знак набран на страницах: у вариативной гарнитуры от нее зависит ширина знака. */
  weight?: number;
  /** Готовый `size-adjust` начертания на шрифте, которого нет на маке: подгонка его не меряет, а печатает как есть. */
  sizeAdjust?: number;
};

/** Текстовый узел со стилем своего элемента: свойства текста, от которых зависят ширина и высота строки. */
export type StyledText = { text: string; family: string; style: Record<string, string> };

/** Текстовый узел строки расписания: из какой части строки и какой гарнитурой набран. */
type RowText = StyledText & { part: string };

/** Стиль узла даты в строке расписания: сами даты засева сдвигаются каждый день и меряются отдельно. */
type RowDate = Omit<RowText, 'text'>;

type CollectOptions = {
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
 * Тексты узлов по первому семейству их `font-family`, с учетом `text-transform`, по одному на узел.
 * Сверка ширины склеивает их без разделителя, как их рисует страница, а проверка дат смотрит слова
 * каждого узла: в склейке слово месяца сливается с соседним («3 ноябряОБРАЗЕЦ») и не узнается.
 * Функция уходит в `page.evaluate` целиком, поэтому ни на что снаружи не ссылается.
 *
 * На странице берется только нарисованный текст. Узлы с длинным словом засева не входят: это нагрузка
 * для теста переносов, а не текст — одно слово заглавными из восьмидесяти букв занимало треть текста
 * Ponomar на главной засева. Даты (`<time>`) не входят тоже: засев ставит их от сегодняшнего дня, и с ними
 * сверка на CI краснела или зеленела по дням (1,0199 для 24.09 и 1,0213 для 25.09 на одной сборке);
 * все даты целиком меряются отдельно, в эталонных текстах.
 */
export const collectTexts = ({ skip, onPage, stress }: CollectOptions) => {
  const texts: Record<string, string[]> = {};
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

    (texts[family] ??= []).push(style.textTransform === 'uppercase' ? text.toUpperCase() : text);
  }

  return texts;
};

/**
 * Знаки со своим начертанием у запасного шрифта: они расходятся с гарнитурой так, что тянут за собой строку.
 * Длинное тире у Arial шире тире Golos Text на 44%, а в строке расписания оно стоит в каждом диапазоне времени.
 * У Ponomar строчные — капитель: «з», «т», «э» у Times уже на 32–37%, «е», «ю», «с», «р» шире на 27–36%, пробел
 * уже на 20%. «От» перед каждой ценой с несколькими билетами уводило строку на 19%, а начертание для одной «т»
 * сломало равновесие дат, где ее уравновешивали широкие «е» и «р», — поэтому свои начертания у всех семи.
 * `size-adjust` такого начертания точный, по ширине самого знака; пока грузится шрифт, эти буквы Times выглядят
 * крупнее или мельче соседних — ширина строки при этом та же.
 *
 * Знака рубля нет ни в Arial, ни в Liberation Sans: без своего начертания его рисовала системная замена, у Arial
 * уже на 24%. Его начертание — на своем шрифте для каждой системы: Helvetica Neue на маке и iOS, FreeSans на Linux
 * (ставится с Chromium Playwright). Шрифта, которого на системе нет, браузер просто не находит и берет следующее
 * начертание, а на Android знак рисует Roboto основного начертания. FreeSans на маке нет, поэтому его `size-adjust`
 * померен в `mcr.microsoft.com/playwright:v1.63.0-noble`: знак рубля Golos Text в 500 на 1000px — 650px, FreeSans — 676px.
 */
export const GLYPH_FACES: Record<string, GlyphFace[]> = {
  Ponomar: [
    { chars: ' \u00a0', range: 'U+20, U+A0' },
    { chars: 'з', range: 'U+437' },
    { chars: 'т', range: 'U+442' },
    { chars: 'э', range: 'U+44D' },
    { chars: 'е', range: 'U+435' },
    { chars: 'ю', range: 'U+44E' },
    { chars: 'с', range: 'U+441' },
    { chars: 'р', range: 'U+440' },
  ],
  'Golos Text': [
    { chars: '—', range: 'U+2014' },
    { chars: '₽', range: 'U+20BD', locals: ['Helvetica Neue'], weight: 500 },
    { chars: '₽', range: 'U+20BD', locals: ['FreeSans'], weight: 500, sizeAdjust: 650 / 676 },
  ],
};

const YEAR = 2026;

const DAYS_IN_YEAR = 365;

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Все дни года словами форматтера страниц, по месяцу в строке: ими подгонка меряет даты строк расписания в стиле
 * узла даты — даты настоящего контента сдвигаются вместе с сегодняшним днем.
 */
export const YEAR_DATES = Array.from({ length: 12 }, (_, month) =>
  Array.from({ length: new Date(Date.UTC(YEAR, month + 1, 0)).getUTCDate() }, (_, day) =>
    formatDate(`${YEAR}-${pad(month + 1)}-${pad(day + 1)}`),
  ).join(' '),
);

/**
 * Даты строк засева так, как их напечатала бы страница в каждый день года: засев ставит их от сегодняшнего дня,
 * и сумма по строкам обязана держаться в любой из дней, а не только в день прогона. Сдвиг идет от дат самих
 * строк, поэтому промежутки между ними те же, что на странице.
 */
export const shiftedRowDates = (days: string[]) =>
  Array.from({ length: DAYS_IN_YEAR }, (_, shift) => days.map((day) => formatDate(shiftDay(day, shift))));

/** Части строк расписания, текст которых сверяется в DOM со стилем узла. */
export const ROW_PARTS_SELECTOR = '[data-schedule-row] [data-row-part]';

/**
 * Текстовые узлы строк расписания со стилем своего элемента — для DOM-замера: canvas не знает
 * `font-variant-numeric`, а время в строках набрано цифрами одной ширины. Пробелы схлопываются, как их
 * схлопывает страница, и остаются по краям узла: «от » перед числом — тоже ширина строки. Узлы с длинным
 * словом засева не входят, как и в `collectTexts`. От дат (`<time>`) берутся стиль — первый же, — день
 * из `datetime` и сам текст: даты меряются отдельно, потому что засев сдвигает их каждый день, а по тексту
 * тест сверяет, что меряет те же строки, что напечатаны на странице.
 * Функция уходит в `page.evaluate` целиком.
 */
export const collectRowTexts = ({ parts, props, stress }: { parts: string; props: string[]; stress: string }) => {
  const texts: RowText[] = [];
  const days: string[] = [];
  const shownDates: string[] = [];
  let date: RowDate | null = null;

  for (const part of document.querySelectorAll(parts)) {
    const walker = document.createTreeWalker(part, NodeFilter.SHOW_TEXT);

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const host = node.parentElement;

      if (!host || !node.nodeValue?.trim() || node.nodeValue.includes(stress)) continue;
      if (!host.checkVisibility({ visibilityProperty: true })) continue;

      const style = getComputedStyle(host);
      const entry = {
        part: part.getAttribute('data-row-part') ?? '',
        family: style.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
        style: Object.fromEntries(props.map((prop) => [prop, style.getPropertyValue(prop)])),
      };

      const time = host.closest('time');

      if (time) {
        date ??= entry;
        days.push(time.dateTime);
        shownDates.push(node.nodeValue);
      } else texts.push({ ...entry, text: node.nodeValue.replace(/\s+/g, ' ') });
    }
  }

  return { texts, date, days, shownDates };
};

/**
 * Размеры текстов в DOM на кегле `size`, каждый своей гарнитурой и со своим стилем. Кегль, `letter-spacing`
 * и `word-spacing` умножаются на один коэффициент: на реальном кегле браузер округляет высоту строки до пикселя
 * (на 25px — 11 px против 12), а раннер на Linux — и ширину. Базовую линию отмечает пустой строчный блок
 * в конце копии. Функция уходит в `page.evaluate` целиком.
 */
export const measureStyledTexts = async ({ texts, size }: { texts: StyledText[]; size: number }) => {
  const box = document.createElement('div');

  box.style.cssText = 'position: absolute; top: 0; left: 0; visibility: hidden; white-space: pre';

  const probes = texts.map(({ text, family, style }) => {
    const span = document.createElement('span');
    const marker = document.createElement('i');
    const scale = size / parseFloat(style['font-size']);

    for (const [prop, value] of Object.entries(style)) span.style.setProperty(prop, value);

    for (const prop of ['letter-spacing', 'word-spacing']) {
      const value = parseFloat(style[prop] ?? '');

      if (!Number.isNaN(value)) span.style.setProperty(prop, `${value * scale}px`);
    }

    span.style.fontSize = `${size}px`;
    span.style.fontFamily = `"${family}"`;
    span.textContent = text;
    marker.style.cssText = 'display: inline-block; width: 0; height: 0; vertical-align: baseline';
    span.append(marker);
    box.append(span, document.createElement('br'));

    return { span, marker };
  });

  document.body.append(box);
  await document.fonts.ready;

  const metrics = probes.map(({ span, marker }) => {
    const rect = span.getBoundingClientRect();
    const baseline = marker.getBoundingClientRect().bottom;

    return { width: rect.width, ascent: baseline - rect.top, descent: rect.bottom - baseline };
  });

  box.remove();

  return metrics;
};
