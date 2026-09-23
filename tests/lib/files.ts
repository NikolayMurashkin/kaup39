import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

export const TOKENS_PATH = join(SRC_DIR, 'styles', 'tokens.scss');

/** Сабсеты шрифтов направления и их лицензии. */
export const FONTS_DIR = join(SRC_DIR, 'styles', 'fonts');

/** Файлы `src/` на любой глубине, чей путь подходит под `pattern`. */
export const sourceFiles = (pattern: RegExp) =>
  readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
    .filter((path) => pattern.test(path))
    .map((path) => join(SRC_DIR, path));
