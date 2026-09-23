import { readFileSync } from 'node:fs';
import { sourceFiles, TOKENS_PATH } from './files';

export type FontFace = {
  family: string;
  /** Дескрипторы `@font-face`, кроме `font-family`, как они записаны в стилях. */
  descriptors: Record<string, string>;
};

const unquote = (value: string) => value.trim().replace(/^(['"])(.*)\1$/, '$2');

/** Семейства из значения `font-family` по порядку, без кавычек. */
export const familiesOf = (value: string) => value.split(',').map(unquote);

/** Имена из `local(...)` в `src` начертания, по порядку. */
export const localsOf = (src: string) => [...src.matchAll(/local\(([^)]+)\)/g)].map(([, name]) => unquote(name));

export const readTokenFontFaces = (): FontFace[] =>
  [...readFileSync(TOKENS_PATH, 'utf8').matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
    const declarations = [...body.matchAll(/([a-z-]+)\s*:\s*([^;]+);/g)].map(
      ([, name, value]) => [name, value.replace(/\s+/g, ' ').trim()] as const,
    );
    const { 'font-family': family = '', ...descriptors } = Object.fromEntries(declarations);

    return { family: unquote(family), descriptors };
  });

/** Токены шрифтов, на которые ссылаются стили и разметка, — объявление в `tokens.scss` не в счет. */
export const usedFontTokens = () =>
  [
    ...new Set(
      sourceFiles(/\.(scss|tsx?)$/).flatMap((path) =>
        [...readFileSync(path, 'utf8').matchAll(/var\((--font-[a-z-]+)[,)]/g)].map(([, token]) => token),
      ),
    ),
  ].sort();
