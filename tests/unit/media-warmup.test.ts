import type { NextConfig } from 'next';
import { imageConfigDefault } from 'next/dist/shared/lib/image-config';
import { describe, expect, it } from 'vitest';
import { warmupPaths } from '@/cms/warmup';
import { IMAGES_CONFIG } from '@/lib/images';

/** Ширины оптимизатора так, как их видит Next: умолчания с поправками конфига, по возрастанию, без повторов. */
const config = IMAGES_CONFIG as NonNullable<NextConfig['images']>;
const WIDTHS = [
  ...new Set([
    ...(config.imageSizes ?? imageConfigDefault.imageSizes),
    ...(config.deviceSizes ?? imageConfigDefault.deviceSizes),
  ]),
].sort((first, second) => first - second);
const QUALITIES = IMAGES_CONFIG.qualities;

/**
 * Адрес загрузчика Next по умолчанию на каждую ширину оптимизатора и каждое качество: `srcSet` у `<Image>` перечисляет
 * и ширины шире файла (оптимизатор отдаст файл как есть, но ключ кэша у каждой ширины свой), поэтому греются все.
 */
const expectedPaths = (url: string) =>
  WIDTHS.flatMap((width) =>
    QUALITIES.map((quality) => `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`),
  );

const URL_JPG = '/api/media/file/proverka.jpg';

describe('адреса прогрева оптимизатора', () => {
  it('кадр 1000 px — все ширины оптимизатора, в том числе шире файла, на каждое качество', () => {
    const paths = warmupPaths({ url: URL_JPG, width: 1000 });
    const expected = expectedPaths(URL_JPG);
    const widths = new Set(paths.map((path) => Number(new URLSearchParams(path.split('?')[1]).get('w'))));

    expect(WIDTHS.filter((width) => width > 1000).length).toBeGreaterThan(0);
    expect(WIDTHS.filter((width) => width > 1000).every((width) => widths.has(width))).toBe(true);
    expect(paths).toHaveLength(expected.length);
    expect([...paths].sort()).toEqual([...expected].sort());
  });

  it.each([
    { case: 'шире всех ширин оптимизатора', width: 5000 },
    { case: 'уже самой малой ширины', width: 20 },
  ])('кадр $width px ($case) — все ширины на каждое качество', ({ width }) => {
    const paths = warmupPaths({ url: URL_JPG, width });
    const expected = expectedPaths(URL_JPG);

    expect(paths).toHaveLength(expected.length);
    expect([...paths].sort()).toEqual([...expected].sort());
  });

  it('имя файла с пробелом и кириллицей кодируется, а разбор возвращает адрес дословно', () => {
    const url = '/api/media/file/кадр 1.jpg';
    const paths = warmupPaths({ url, width: 1000 });

    expect(paths).toHaveLength(expectedPaths(url).length);

    for (const path of paths) {
      const [, search = ''] = path.split('?');

      expect(path).toContain(`url=${encodeURIComponent(url)}&`);
      expect(new URLSearchParams(search).get('url')).toBe(url);
    }
  });
});
