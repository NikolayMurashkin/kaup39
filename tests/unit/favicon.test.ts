import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** Соглашение App Router: `src/app/favicon.ico` отдается по `/favicon.ico`. */
const FAVICON = fileURLToPath(new URL('../../src/app/favicon.ico', import.meta.url));

/** Значок с сайта владельцев: лежит в плановой части студии и в git не входит, на CI его нет. */
const OWNERS_FAVICON = fileURLToPath(new URL('../../../research/kaup39/favicon/favicon.ico', import.meta.url));

/** Размеры картинок из каталога ICO: байт ширины 0 означает 256. */
const iconSizes = (data: Buffer) =>
  Array.from({ length: data.readUInt16LE(4) }, (_, index) => {
    const entry = 6 + index * 16;

    return { width: data[entry] || 256, height: data[entry + 1] || 256 };
  });

describe('favicon.ico', () => {
  it('файл ICO с картинками 16 и 32', () => {
    expect(existsSync(FAVICON), 'src/app/favicon.ico нет').toBe(true);

    const data = readFileSync(FAVICON);
    const sizes = iconSizes(data);

    expect([...data.subarray(0, 4)]).toEqual([0x00, 0x00, 0x01, 0x00]);
    expect(sizes.length).toBeGreaterThanOrEqual(1);
    expect(sizes).toEqual(
      expect.arrayContaining([
        { width: 16, height: 16 },
        { width: 32, height: 32 },
      ]),
    );
  });

  it.skipIf(!existsSync(OWNERS_FAVICON))('значок владельцев перенесен байт в байт', () => {
    expect(existsSync(FAVICON), 'src/app/favicon.ico нет').toBe(true);
    expect(readFileSync(FAVICON).equals(readFileSync(OWNERS_FAVICON))).toBe(true);
  });
});
