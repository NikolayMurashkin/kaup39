#!/usr/bin/env node
/**
 * Снимок таблицы токенов артборда «Кауп» для тестов репозитория.
 *
 * Артборд `design/kaup/Kaup.dc.html` лежит в плановой части студии и намеренно не входит
 * ни в один git, поэтому на GitHub Actions его нет. Тест токенов сверяет SCSS не с самим
 * артбордом, а с этим снимком; когда артборд доступен (то есть на маке), тот же тест
 * пересобирает снимок в памяти и падает, если он разошелся с артбордом.
 *
 * Запуск: yarn sync:tokens [путь до Kaup.dc.html]
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

export const DEFAULT_ARTBOARD = resolve(HERE, '..', '..', 'design', 'kaup', 'Kaup.dc.html');

const SNAPSHOT = join(HERE, '..', 'tests', 'fixtures', 'artboard-tokens.json');

/** Блок артборда → группа значений в SCSS репозитория. */
const GROUPS: { name: TokenGroup; selector: string }[] = [
  { name: 'dark', selector: '.board' },
  { name: 'light', selector: '.board.light' },
  { name: 'narrow', selector: '.board.narrow' },
  { name: 'narrowLight', selector: '.board.narrow.light' },
];

/**
 * Токены артборда, которых нет в CSS: это кадры первого экрана, в артборде — пути к выгрузке
 * `research/kaup39/media/` вне репозитория. На страницах кадр приезжает из CMS.
 */
const ARTBOARD_ONLY = ['--photo-night', '--photo-day'];

const squash = (value: string) => value.replace(/\s+/g, ' ').trim();

const blockOf = (source: string, selector: string) => {
  const start = new RegExp(`${selector.replace(/\./g, '\\.')}\\s*\\{`).exec(source);

  if (!start) {
    throw new Error(`в артборде нет блока токенов ${selector}`);
  }

  const from = start.index + start[0].length;

  return source.slice(from, source.indexOf('}', from));
};

const declarationsOf = (source: string, selector: string): Record<string, string> =>
  Object.fromEntries(
    [...blockOf(source, selector).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)]
      .filter(([, name]) => !ARTBOARD_ONLY.includes(name))
      .map(([, name, value]) => [name, squash(value)]),
  );

export const readArtboard = (path: string): ArtboardSnapshot => {
  const source = readFileSync(path, 'utf8');

  const css = Object.fromEntries(
    GROUPS.map(({ name, selector }) => [name, declarationsOf(source, selector)]),
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
