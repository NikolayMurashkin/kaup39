import { readFileSync } from 'node:fs';
import { sourceFiles, TOKENS_PATH } from './files';

export type FontFace = {
  family: string;
  /** Дескрипторы `@font-face`, кроме `font-family`, как они записаны в стилях. */
  descriptors: Record<string, string>;
};

/** Отдельное начертание запасного шрифта для знаков из `range`. */
type GlyphFace = {
  range: string;
  /** Свои локальные шрифты начертания — у знака, которого нет в шрифтах запасного начертания гарнитуры. */
  locals?: string[];
  /** `size-adjust` начертания долей, если он задан на шрифте не своей гарнитуры. */
  sizeAdjust?: number;
};

/** Цифры запасного шрифта расходятся с цифрами гарнитур сильнее букв, поэтому у них свое начертание. */
export const DIGITS_RANGE = 'U+30-39';

/**
 * Знаки со своим начертанием у запасного шрифта гарнитуры, кроме цифр: пробелы, строчные буквы Ponomar (капитель)
 * и Golos Text, которые расходятся с Times и Arial так, что тянут за собой строку, длинное тире, знак рубля.
 * Знака рубля нет ни в Arial, ни в Liberation Sans, поэтому его начертание — на своем шрифте для каждой системы:
 * Helvetica Neue на маке и iOS, FreeSans на Linux. `size-adjust` у FreeSans — отношение ширины знака рубля
 * Golos Text в 500 к ширине того же знака FreeSans на 1000px.
 */
export const GLYPH_FACES: Record<string, GlyphFace[]> = {
  Ponomar: [
    { range: 'U+20, U+A0' },
    { range: 'U+437' },
    { range: 'U+442' },
    { range: 'U+44D' },
    { range: 'U+435' },
    { range: 'U+44E' },
    { range: 'U+441' },
    { range: 'U+440' },
  ],
  'Golos Text': [
    { range: 'U+20, U+A0' },
    { range: 'U+433' },
    { range: 'U+43A' },
    { range: 'U+444' },
    { range: 'U+2014' },
    { range: 'U+20BD', locals: ['Helvetica Neue'] },
    { range: 'U+20BD', locals: ['FreeSans'], sizeAdjust: 650 / 676 },
  ],
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
