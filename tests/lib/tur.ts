import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Выгрузка страницы `/tur` лежит в плановой части студии и в git не входит: на CI ее нет. */
const TUR_PATH = fileURLToPath(new URL('../../../research/kaup39/html/tur.html', import.meta.url));

export const turIsReachable = () => existsSync(TUR_PATH);

/** Zero-блоки `/tur`: сетка дневного события по месяцам и список дат вечернего. */
const TUR_BLOCKS = { denvikingi: 'rec1346235071', ragnarek: 'rec1355017771' } as const;

type TurElement = { top: number; left: number; text: string };

const decode = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

const numberAttribute = (attributes: string, name: string) => {
  const match = new RegExp(`${name}="(-?\\d+)"`).exec(attributes);

  return match ? Number(match[1]) : null;
};

/**
 * Текстовые элементы Zero-блока, которые посетитель видит на десктопе. Тильда прячет элементы, вынося
 * их за артборд: отрицательный `left` или `top` ниже высоты артборда — такой элемент в HTML есть,
 * а на странице нет.
 */
const visibleTurElements = (block: string): TurElement[] => {
  const html = readFileSync(TUR_PATH, 'utf8');
  const start = html.indexOf(`<div id="${block}"`);
  const end = html.indexOf('<div id="rec', start + 1);
  const record = html.slice(start, end === -1 ? undefined : end);
  const height = numberAttribute(record, 'data-artboard-height');

  if (start === -1 || height === null) {
    throw new Error(`в tur.html нет Zero-блока ${block}`);
  }

  return [...record.matchAll(/<div class='t396__elem[^']*'([^>]*)>([\s\S]*?)(?=<div class='t396__elem|$)/g)]
    .map(([, attributes, body]) => ({
      top: numberAttribute(attributes, 'data-field-top-value') ?? -1,
      left: numberAttribute(attributes, 'data-field-left-value') ?? -1,
      text: decode(body),
    }))
    .filter((element) => element.text && element.left >= 0 && element.top >= 0 && element.top < height);
};

const MONTH_HEADER = /^\S+ с \d\d:\d\d до \d\d:\d\d$/i;
const DAY_LIST = /^\d\d(; \d\d)*$/;
const EVENING_ROW = /^\d\d\.\d\d\.\d\d с \d\d:\d\d до \d\d:\d\d шоу \d\d:\d\d$/;

export type TurDayRow = { header: string; days: string };

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * Сетка дневного события: заголовки «МЕСЯЦ с … до …» стоят тремя колонками, под каждым — строка дней.
 * Строка дней относится к ближайшему сверху заголовку своей колонки; колонка — ближайшая по среднему
 * `left` заголовков (у строк дней отступ свой, до 120px правее заголовка).
 */
export const turDayRows = (): TurDayRow[] => {
  const elements = visibleTurElements(TUR_BLOCKS.denvikingi);
  const headers = elements.filter((element) => MONTH_HEADER.test(element.text)).sort((a, b) => a.left - b.left);
  const columns = headers.reduce<TurElement[][]>((result, header) => {
    const last = result.at(-1);

    if (last && header.left - last[last.length - 1].left < 200) last.push(header);
    else result.push([header]);

    return result;
  }, []);

  return elements
    .filter((element) => DAY_LIST.test(element.text))
    .map((days) => {
      const column = columns.reduce((best, candidate) =>
        Math.abs(mean(candidate.map((header) => header.left)) - days.left) <
        Math.abs(mean(best.map((header) => header.left)) - days.left)
          ? candidate
          : best,
      );
      const header = column
        .filter((candidate) => candidate.top < days.top)
        .reduce((best, candidate) => (candidate.top > best.top ? candidate : best));

      return { header: header.text, days: days.text };
    });
};

export const turEveningRows = () =>
  visibleTurElements(TUR_BLOCKS.ragnarek)
    .flatMap((element) => element.text.split('\n'))
    .filter((line) => EVENING_ROW.test(line));

/** Цены обоих блоков одной строкой на элемент: «700 рублей» и «Взрослый: 1000 / Детский: 700 / …». */
export const turPriceTexts = () => ({
  denvikingi: visibleTurElements(TUR_BLOCKS.denvikingi)
    .map((element) => element.text)
    .filter((text) => /^\d+ рублей$/.test(text)),
  ragnarek: visibleTurElements(TUR_BLOCKS.ragnarek)
    .map((element) => element.text.replace(/\n/g, ' / '))
    .filter((text) => /Взрослый/.test(text)),
});
