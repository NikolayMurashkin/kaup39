import fontverter from 'fontverter';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONTS_DIR } from '../lib/files';
import { readNames } from '../../scripts/sfnt-name.mts';

/** Записи таблицы `name`, где зарезервированное имя остается законно: копирайт, лицензия и ее адрес. */
const NOTICE_IDS = [0, 13, 14];

const reserved = readdirSync(FONTS_DIR)
  .filter((file) => file.endsWith('-OFL.txt'))
  .flatMap((file) =>
    [...readFileSync(join(FONTS_DIR, file), 'utf8').matchAll(/Reserved Font Names? "([^"]+)"/gi)].map(([, name]) => ({
      font: file.replace(/-OFL\.txt$/, '.woff2'),
      name,
    })),
  );

const namesOf = async (font: string) =>
  readNames(await fontverter.convert(readFileSync(join(FONTS_DIR, font)), 'truetype'));

describe('лицензии OFL шрифтов направления', () => {
  it('зарезервированное имя объявлено ровно у одного шрифта — Forum', () => {
    expect(reserved).toEqual([{ font: 'forum.woff2', name: 'Forum' }]);
  });

  it.each(reserved)(
    '$font: сабсет — модифицированная версия, зарезервированного имени $name нет нигде, кроме копирайта и лицензии',
    async ({ font, name }) => {
      const names = await namesOf(font);

      expect(
        names.filter(
          ({ nameId, value }) => !NOTICE_IDS.includes(nameId) && value.toLowerCase().includes(name.toLowerCase()),
        ),
      ).toEqual([]);
      expect(names.find(({ nameId }) => nameId === 0)?.value).toMatch(/^Copyright/);
    },
  );
});
