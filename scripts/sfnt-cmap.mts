/**
 * Чтение таблицы `cmap` шрифта формата sfnt: какие знаки Unicode у шрифта есть.
 *
 * Нужна проверке знаков текстов CMS (`scripts/cms-glyphs.mts`): знак есть в наборе сабсета, а в самом
 * шрифте его может не быть — тогда браузер возьмет запасную гарнитуру. Разбираются подтаблицы формата 4
 * (только BMP) и 12 (весь Unicode); предпочтение — Windows Unicode полный (3/10), затем Windows BMP (3/1),
 * затем любая подтаблица платформы Unicode (0/*).
 */
import { readTables } from './sfnt-name.mts';

type Subtable = { platformId: number; encodingId: number; data: Buffer };

const ENCODING_RECORD_SIZE = 8;

const SEGMENT_SIZE = 2;

const GROUP_SIZE = 12;

const SUPPORTED_FORMATS = new Set([4, 12]);

/** Порядок предпочтения подтаблиц: меньше — лучше; платформа Macintosh (1) не берется. */
const preference = ({ platformId, encodingId }: Subtable) => {
  if (platformId === 3 && encodingId === 10) return 0;
  if (platformId === 3 && encodingId === 1) return 1;
  if (platformId === 0) return 2;

  return null;
};

const subtables = (cmap: Buffer): Subtable[] =>
  Array.from({ length: cmap.readUInt16BE(2) }, (_, index) => {
    const record = 4 + index * ENCODING_RECORD_SIZE;

    return {
      platformId: cmap.readUInt16BE(record),
      encodingId: cmap.readUInt16BE(record + 2),
      data: cmap.subarray(cmap.readUInt32BE(record + 4)),
    };
  });

const format4 = (table: Buffer) => {
  const segments = table.readUInt16BE(6) / 2;
  const ends = 14;
  const starts = ends + segments * SEGMENT_SIZE + 2;
  const deltas = starts + segments * SEGMENT_SIZE;
  const rangeOffsets = deltas + segments * SEGMENT_SIZE;
  const codePoints: number[] = [];

  for (let segment = 0; segment < segments; segment += 1) {
    const end = table.readUInt16BE(ends + segment * SEGMENT_SIZE);
    const start = table.readUInt16BE(starts + segment * SEGMENT_SIZE);
    const delta = table.readInt16BE(deltas + segment * SEGMENT_SIZE);
    const rangeOffsetAt = rangeOffsets + segment * SEGMENT_SIZE;
    const rangeOffset = table.readUInt16BE(rangeOffsetAt);

    for (let code = start; code <= end && code !== 0xffff; code += 1) {
      const index = rangeOffset === 0 ? code : table.readUInt16BE(rangeOffsetAt + rangeOffset + (code - start) * 2);
      const glyph = rangeOffset !== 0 && index === 0 ? 0 : (index + delta) & 0xffff;

      if (glyph !== 0) codePoints.push(code);
    }
  }

  return codePoints;
};

const format12 = (table: Buffer) => {
  const codePoints: number[] = [];

  for (let group = 0; group < table.readUInt32BE(12); group += 1) {
    const offset = 16 + group * GROUP_SIZE;
    const start = table.readUInt32BE(offset);
    const firstGlyph = table.readUInt32BE(offset + 8);

    for (let code = start; code <= table.readUInt32BE(offset + 4); code += 1) {
      if (firstGlyph + (code - start) !== 0) codePoints.push(code);
    }
  }

  return codePoints;
};

/** Знаки, которым таблица `cmap` шрифта сопоставляет глиф (не `.notdef`). */
export const readCharacters = (font: Buffer) => {
  const cmap = readTables(font).find(({ tag }) => tag === 'cmap');

  if (!cmap) throw new Error('в шрифте нет таблицы cmap');

  const best = subtables(cmap.data)
    .filter((subtable) => preference(subtable) !== null && SUPPORTED_FORMATS.has(subtable.data.readUInt16BE(0)))
    .sort((left, right) => (preference(left) ?? 0) - (preference(right) ?? 0))[0];

  if (!best) throw new Error('в таблице cmap нет подтаблицы Unicode формата 4 или 12');

  const codePoints = best.data.readUInt16BE(0) === 4 ? format4(best.data) : format12(best.data);

  return new Set(codePoints.map((code) => String.fromCodePoint(code)));
};
