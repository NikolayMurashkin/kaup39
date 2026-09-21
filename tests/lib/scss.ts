import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type ScssRule = {
  /** Условие обрамляющего `@media`, если правило лежит внутри него. */
  media: string | null;
  selector: string;
  declarations: Record<string, string>;
};

const TOKENS_PATH = fileURLToPath(new URL('../../src/styles/tokens.scss', import.meta.url));

const squash = (value: string) => value.replace(/\s+/g, ' ').trim();

/**
 * Значение CSS без следов форматирования: Prettier переносит длинный градиент на несколько строк
 * и срезает хвостовой ноль (`0.30` → `0.3`). Побайтовое сравнение с артбордом ловило бы эти
 * переносы, а не подмену значения, поэтому сравниваются значения, а не их запись.
 *
 * Хвостовой ноль срезается только внутри чисел: точка в `url(grain.png)` должна остаться,
 * иначе `url(grain.png)` и `url(grainpng)` сравнялись бы.
 */
export const normalizeCssValue = (value: string) =>
  squash(value)
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+,/g, ',')
    .replace(/(\d+\.\d*?)0+(?=\D|$)/g, '$1')
    .replace(/(\d+)\.(?=\D|$)/g, '$1');

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
