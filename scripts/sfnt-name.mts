/**
 * Чтение и перезапись таблицы `name` в шрифте формата sfnt (TrueType/OpenType без сжатия).
 *
 * Нужна из-за OFL: сабсет — модифицированная версия шрифта, и если в его лицензии объявлено
 * зарезервированное имя (Reserved Font Name), это имя не может оставаться именем модифицированной
 * версии (OFL-FAQ 2.6–2.8). harfbuzz в сборке `subset-font` переписывать имена не умеет.
 */

export type NameRecord = {
  platformId: number;
  encodingId: number;
  languageId: number;
  nameId: number;
  value: string;
};

const HEADER_SIZE = 12;

const TABLE_RECORD_SIZE = 16;

const NAME_RECORD_SIZE = 12;

/** Смещение `checkSumAdjustment` внутри таблицы `head`. */
const CHECKSUM_ADJUSTMENT_OFFSET = 8;

const CHECKSUM_MAGIC = 0xb1b0afba;

/** Платформы 0 (Unicode) и 3 (Windows) хранят строки в UTF-16BE, 1 (Macintosh) — однобайтово. */
const isUtf16 = (platformId: number) => platformId === 0 || platformId === 3;

const decode = (bytes: Buffer, platformId: number) =>
  isUtf16(platformId) ? Buffer.from(bytes).swap16().toString('utf16le') : bytes.toString('latin1');

const encode = (value: string, platformId: number) =>
  isUtf16(platformId) ? Buffer.from(value, 'utf16le').swap16() : Buffer.from(value, 'latin1');

const readTables = (font: Buffer) =>
  Array.from({ length: font.readUInt16BE(4) }, (_, index) => {
    const record = HEADER_SIZE + index * TABLE_RECORD_SIZE;
    const offset = font.readUInt32BE(record + 8);

    return {
      tag: font.toString('latin1', record, record + 4),
      data: font.subarray(offset, offset + font.readUInt32BE(record + 12)),
    };
  });

const nameTable = (font: Buffer) => {
  const table = readTables(font).find(({ tag }) => tag === 'name');

  if (!table) throw new Error('в шрифте нет таблицы name');
  if (table.data.readUInt16BE(0) !== 0) throw new Error('таблица name формата 1 не поддерживается');

  return table.data;
};

export const readNames = (font: Buffer): NameRecord[] => {
  const table = nameTable(font);
  const storage = table.readUInt16BE(4);

  return Array.from({ length: table.readUInt16BE(2) }, (_, index) => {
    const record = 6 + index * NAME_RECORD_SIZE;
    const platformId = table.readUInt16BE(record);
    const start = storage + table.readUInt16BE(record + 10);

    return {
      platformId,
      encodingId: table.readUInt16BE(record + 2),
      languageId: table.readUInt16BE(record + 4),
      nameId: table.readUInt16BE(record + 6),
      value: decode(table.subarray(start, start + table.readUInt16BE(record + 8)), platformId),
    };
  });
};

const writeNames = (records: NameRecord[]) => {
  const strings = records.map(({ value, platformId }) => encode(value, platformId));
  const storage = 6 + records.length * NAME_RECORD_SIZE;
  const table = Buffer.alloc(storage);

  table.writeUInt16BE(0, 0);
  table.writeUInt16BE(records.length, 2);
  table.writeUInt16BE(storage, 4);

  let offset = 0;

  records.forEach(({ platformId, encodingId, languageId, nameId }, index) => {
    const record = 6 + index * NAME_RECORD_SIZE;

    table.writeUInt16BE(platformId, record);
    table.writeUInt16BE(encodingId, record + 2);
    table.writeUInt16BE(languageId, record + 4);
    table.writeUInt16BE(nameId, record + 6);
    table.writeUInt16BE(strings[index].length, record + 8);
    table.writeUInt16BE(offset, record + 10);
    offset += strings[index].length;
  });

  return Buffer.concat([table, ...strings]);
};

const pad4 = (data: Buffer) => Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);

const checksum = (data: Buffer) => {
  const padded = pad4(data);
  let sum = 0;

  for (let offset = 0; offset < padded.length; offset += 4) {
    sum = (sum + padded.readUInt32BE(offset)) >>> 0;
  }

  return sum;
};

/**
 * Шрифт с подмененными строками таблицы `name`: `overrides` — новые значения по `nameId`,
 * остальные записи (копирайт, лицензия, версия) переносятся как есть. Шрифт собирается заново:
 * таблицы по порядку тегов, выравнивание на 4 байта, контрольные суммы и `checkSumAdjustment`.
 */
export const renameFont = (font: Buffer, overrides: Record<number, string>) => {
  const names = writeNames(
    readNames(font).map((record) => ({ ...record, value: overrides[record.nameId] ?? record.value })),
  );
  const tables = readTables(font)
    .map(({ tag, data }) => ({ tag, data: tag === 'name' ? names : Buffer.from(data) }))
    .sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const head = tables.find(({ tag }) => tag === 'head');

  if (!head) throw new Error('в шрифте нет таблицы head');

  head.data.writeUInt32BE(0, CHECKSUM_ADJUSTMENT_OFFSET);

  const header = Buffer.alloc(HEADER_SIZE + tables.length * TABLE_RECORD_SIZE);

  font.copy(header, 0, 0, HEADER_SIZE);

  let offset = header.length;

  tables.forEach(({ tag, data }, index) => {
    const record = HEADER_SIZE + index * TABLE_RECORD_SIZE;

    header.write(tag, record, 'latin1');
    header.writeUInt32BE(checksum(data), record + 4);
    header.writeUInt32BE(offset, record + 8);
    header.writeUInt32BE(data.length, record + 12);
    offset += pad4(data).length;
  });

  const result = Buffer.concat([header, ...tables.map(({ data }) => pad4(data))]);
  const headOffset = result.readUInt32BE(HEADER_SIZE + tables.indexOf(head) * TABLE_RECORD_SIZE + 8);

  result.writeUInt32BE((CHECKSUM_MAGIC - checksum(result)) >>> 0, headOffset + CHECKSUM_ADJUSTMENT_OFFSET);

  return result;
};
