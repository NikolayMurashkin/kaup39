#!/usr/bin/env node
/**
 * Снимок рунического алфавита «Каупа» для тестов репозитория.
 *
 * Источник — `design/kaup/runic-alphabet.mjs` в плановой части студии, которая намеренно не входит
 * ни в один git. Работает так же, как снимок таблицы токенов: тест сверяет алфавит компонента со
 * снимком, а когда источник доступен (то есть на маке), пересобирает снимок в памяти и падает при
 * расхождении.
 *
 * Запуск: yarn sync:runes [путь до runic-alphabet.mjs]
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import prettier from 'prettier';

export type RunicLetter = { width: number; lines: [number, number][][] };

export type RunicSnapshot = {
  /** Хеш файла алфавита, из которого снят снимок. */
  sha256: string;
  capHeight: number;
  letterSpacing: number;
  spaceWidth: number;
  letters: Record<string, RunicLetter>;
};

const HERE = dirname(fileURLToPath(import.meta.url));

const DEFAULT_SOURCE = resolve(HERE, '..', '..', 'design', 'kaup', 'runic-alphabet.mjs');

const SNAPSHOT = join(HERE, '..', 'tests', 'fixtures', 'runic-alphabet.json');

export const readAlphabet = async (path: string): Promise<RunicSnapshot> => {
  const alphabet = (await import(pathToFileURL(path).href)) as {
    CAP_HEIGHT: number;
    LETTER_SPACING: number;
    SPACE_WIDTH: number;
    LETTERS: Record<string, RunicLetter>;
  };

  if (Object.keys(alphabet.LETTERS).length === 0) {
    throw new Error('в алфавите нет ни одного знака');
  }

  return {
    sha256: createHash('sha256').update(readFileSync(path, 'utf8')).digest('hex'),
    capHeight: alphabet.CAP_HEIGHT,
    letterSpacing: alphabet.LETTER_SPACING,
    spaceWidth: alphabet.SPACE_WIDTH,
    letters: alphabet.LETTERS,
  };
};

const main = async () => {
  const path = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_SOURCE;
  const snapshot = await readAlphabet(path);

  // снимок попадает под `yarn format:check` наравне с остальными файлами,
  // поэтому пишется сразу в том виде, в каком его ждет Prettier
  const config = await prettier.resolveConfig(SNAPSHOT);
  const json = await prettier.format(JSON.stringify(snapshot), { ...config, filepath: SNAPSHOT });

  writeFileSync(SNAPSHOT, json, 'utf8');
  console.log(`снимок обновлен: знаков ${Object.keys(snapshot.letters).length}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
