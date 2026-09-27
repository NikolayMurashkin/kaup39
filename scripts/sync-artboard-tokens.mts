#!/usr/bin/env node
/**
 * Снимок таблицы токенов артборда «Кауп» для тестов репозитория.
 *
 * Артборд `design/kaup/Kaup-v2.dc.html` (v2, D30) лежит в плановой части студии и намеренно не входит
 * ни в один git, поэтому на GitHub Actions его нет. Тест токенов сверяет SCSS не с самим
 * артбордом, а с этим снимком; когда артборд доступен (то есть на маке), тот же тест
 * пересобирает снимок в памяти и падает, если он разошелся с артбордом.
 *
 * Запуск: yarn sync:tokens [путь до Kaup-v2.dc.html]
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type TokenGroup = 'dark' | 'light' | 'narrow' | 'narrowLight';

export type TableTheme = 'dark' | 'light' | 'narrow';

export type ArtboardSnapshot = {
  /** Хеш файла артборда, из которого снят снимок. */
  sha256: string;
  /** Значения токенов по блокам артборда. */
  css: Record<TokenGroup, Record<string, string>>;
  /** Значения, напечатанные в таблице токенов артборда. */
  table: { token: string; theme: TableTheme; value: string }[];
  /** Пары «текст на фоне», объявленные в таблице токенов. */
  pairs: { text: string; bg: string }[];
};

const HERE = dirname(fileURLToPath(import.meta.url));

export const DEFAULT_ARTBOARD = resolve(HERE, '..', '..', 'design', 'kaup', 'Kaup-v2.dc.html');

/** Артборд B50: по его тексту считаются запасные начертания, таблица токенов снимается с v2. */
export const B50_ARTBOARD = resolve(HERE, '..', '..', 'design', 'kaup', 'Kaup.dc.html');

const SNAPSHOT = join(HERE, '..', 'tests', 'fixtures', 'artboard-tokens.json');

/** Блок артборда → группа значений в SCSS репозитория. Узкая ширина — блоки внутри медиазапроса. */
const GROUPS: { name: TokenGroup; selector: string; narrow: boolean }[] = [
  { name: 'dark', selector: '.board', narrow: false },
  { name: 'light', selector: '.board.light', narrow: false },
  { name: 'narrow', selector: '.board', narrow: true },
  { name: 'narrowLight', selector: '.board.light', narrow: true },
];

const NARROW_MEDIA = /^@media\s*\(\s*max-width\s*:\s*640px\s*\)$/;

/**
 * Токены артборда, которых нет в CSS: это кадры первого экрана, в артборде — пути к выгрузке
 * `research/kaup39/media/` вне репозитория. На страницах кадр приезжает из CMS.
 */
const ARTBOARD_ONLY = ['--photo-night', '--photo-day'];

const squash = (value: string) => value.replace(/\s+/g, ' ').trim();

type CssBlock = { selector: string; media: string | null; body: string };

/** Правила стилей артборда с медиазапросом, в котором они лежат. Вложенность — только `@media`. */
const cssBlocks = (source: string): CssBlock[] => {
  const css = source.slice(source.indexOf('<style>'), source.indexOf('</style>')).replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: CssBlock[] = [];
  let media: string | null = null;
  let depth = 0;
  let head = 0;

  for (let index = 0; index < css.length; index += 1) {
    if (css[index] === '{') {
      const prelude = squash(css.slice(head, index).replace(/^<style>/, ''));

      if (prelude.startsWith('@media')) {
        media = prelude;
        depth += 1;
        head = index + 1;
        continue;
      }

      const end = css.indexOf('}', index);

      blocks.push({ selector: prelude, media, body: css.slice(index + 1, end) });
      index = end;
      head = end + 1;
    } else if (css[index] === '}') {
      depth -= 1;
      media = depth > 0 ? media : null;
      head = index + 1;
    }
  }

  return blocks;
};

const declarationsOf = (blocks: CssBlock[], selector: string, narrow: boolean): Record<string, string> => {
  const matched = blocks.filter(
    (block) => block.selector === selector && (narrow ? NARROW_MEDIA.test(block.media ?? '') : block.media === null),
  );

  if (matched.length === 0) {
    throw new Error(`в артборде нет блока токенов ${selector}${narrow ? ' на узкой ширине' : ''}`);
  }

  return Object.fromEntries(
    matched
      .flatMap((block) => [...block.body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)])
      .filter(([, name]) => !ARTBOARD_ONLY.includes(name))
      .map(([, name, value]) => [name, squash(value)]),
  );
};

export const readArtboard = (path: string): ArtboardSnapshot => {
  const source = readFileSync(path, 'utf8');

  const blocks = cssBlocks(source);
  const css = Object.fromEntries(
    GROUPS.map(({ name, selector, narrow }) => [name, declarationsOf(blocks, selector, narrow)]),
  ) as ArtboardSnapshot['css'];

  const table = [
    ...source.matchAll(/data-token="(--[a-z0-9-]+)"\s+data-theme="(dark|light|narrow)"[^>]*>([^<]*)</g),
  ].map(([, token, theme, value]) => ({ token, theme: theme as TableTheme, value: squash(value) }));

  const pairs = [...source.matchAll(/data-pair="([^"]+)"/g)].map(([, value]) => {
    const [text, bg] = value.split(' on ').map((part) => part.trim());

    if (!text || !bg) {
      throw new Error(`пара записана не в формате "--text-* on --bg-*": ${value}`);
    }

    return { text, bg };
  });

  if (table.length === 0) {
    throw new Error('в таблице токенов артборда нет ни одного значения');
  }

  if (pairs.length === 0) {
    throw new Error('в таблице токенов артборда нет ни одной пары');
  }

  return { sha256: createHash('sha256').update(source).digest('hex'), css, table, pairs };
};

const main = () => {
  const path = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_ARTBOARD;
  const snapshot = readArtboard(path);

  writeFileSync(SNAPSHOT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`снимок обновлен: значений в таблице ${snapshot.table.length}, пар ${snapshot.pairs.length}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
