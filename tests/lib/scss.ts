import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ScssRule = {
  /** Условие обрамляющего `@media`, если правило лежит внутри него. */
  media: string | null;
  selector: string;
  declarations: Record<string, string>;
};

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

const TOKENS_PATH = join(SRC_DIR, 'styles', 'tokens.scss');

const squash = (value: string) => value.replace(/\s+/g, ' ').trim();

/**
 * Значение CSS без следов форматирования: Prettier переносит длинный градиент на несколько строк
 * и срезает хвостовой ноль (`0.30` → `0.3`). Побайтовое сравнение с артбордом ловило бы эти
 * переносы, а не подмену значения, поэтому сравниваются значения, а не их запись.
 *
 * Числа сравниваются как числа, а все остальное — как есть: точка в `url(grain2.png)` должна
 * остаться, иначе `url(grain2.png)` и `url(grain2png)` сравнялись бы.
 */
export const normalizeCssValue = (value: string) =>
  squash(value)
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+,/g, ',')
    .replace(/\d+\.\d+/g, (number) => String(Number(number)));

const declarationsOf = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, squash(value)]),
  );

const parseScss = (source: string): ScssRule[] => {
  const rules: ScssRule[] = [];
  const stack: string[] = [];
  let buffer = '';

  for (const char of source) {
    if (char === '{') {
      stack.push(squash(buffer));
      buffer = '';
      continue;
    }

    if (char === '}') {
      const prelude = stack.pop();

      if (prelude !== undefined && !prelude.startsWith('@')) {
        rules.push({
          media: stack.find((item) => item.startsWith('@media')) ?? null,
          selector: prelude,
          declarations: declarationsOf(buffer),
        });
      }

      buffer = '';
      continue;
    }

    buffer += char;
  }

  return rules;
};

export const readTokenRules = () => parseScss(readFileSync(TOKENS_PATH, 'utf8'));

const scssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      return scssFiles(path);
    }

    return path.endsWith('.scss') ? [path] : [];
  });

/** Медиазапросы всех стилей репозитория, а не только файла токенов: брейкпоинт повторяется в модулях. */
export const readAllMedias = () => [
  ...new Set(
    scssFiles(SRC_DIR).flatMap((path) =>
      parseScss(readFileSync(path, 'utf8')).flatMap((rule) => (rule.media === null ? [] : [rule.media])),
    ),
  ),
];
