const codePoints = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => String.fromCodePoint(from + index)).join('');

// Неразрывный пробел и мягкий перенос: литералами их не видно ни в файле, ни в дифе, поэтому только через коды.
const INVISIBLE_MARKS = String.fromCodePoint(0x00a0, 0x00ad);

const BASIC_LATIN = codePoints(0x20, 0x7e);
const LATIN_1_PUNCTUATION = '«»·';
const CYRILLIC = codePoints(0x400, 0x45f);
const GENERAL_PUNCTUATION = '–—‘’“”„•…';
const SYMBOLS = '№₽';

/**
 * Знаки, которые остаются в сабсетах всех трех гарнитур. Знака нет в наборе — он отрисуется
 * запасной гарнитурой, поэтому покрытие текстов репозитория проверяет `tests/unit/font-subset.test.ts`.
 * Знак рубля есть только в Golos Text: в Ponomar и Forum его нет, и `Price` набирает его текстовой гарнитурой.
 * В самих шрифтах нет и части знаков набора: в Ponomar — «№», в Forum — «Ѐ», в Golos Text — «Ѐ Ѝ ѐ ѝ»;
 * такой знак отрисуется запасной гарнитурой.
 */
export const GLYPHS = BASIC_LATIN + INVISIBLE_MARKS + LATIN_1_PUNCTUATION + CYRILLIC + GENERAL_PUNCTUATION + SYMBOLS;
