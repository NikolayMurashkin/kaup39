import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Photo } from '@/cms/types';
import { PhotoViewer } from '@/components/PhotoViewer';

/** Ширина окна просмотра на широком экране. */
const VIEWER_WIDTH = 1180;

const FILES: [number, number][] = [
  [820, 602],
  [1600, 1000],
  [3000, 2000],
];

const shot = (width: number, height: number): Photo => ({
  src: `/api/media/file/shot-${width}.jpg`,
  alt: 'Кадр',
  caption: null,
  width,
  height,
  temporary: false,
});

/** Кадр внутри диалога просмотра: его `srcset` и `sizes`, кандидаты — ширина из адреса и дескриптор. */
const viewerImage = (photo: Photo) => {
  const markup = renderToStaticMarkup(
    <PhotoViewer
      label="Галерея"
      photos={[photo]}
    />,
  );
  const image = markup.slice(markup.indexOf('<dialog')).match(/<img [^>]*>/)?.[0] ?? '';
  const attribute = (name: string) => image.match(new RegExp(` ${name}="([^"]*)"`))?.[1] ?? '';
  const candidates = attribute('srcSet')
    .split(', ')
    .filter(Boolean)
    .map((candidate) => ({
      requested: Number(candidate.match(/[?&;]w=(\d+)/)?.[1]),
      descriptor: Number(candidate.match(/ (\d+)w$/)?.[1]),
    }));

  return { candidates, sizes: attribute('sizes') };
};

describe('просмотр фото: кадр не больше собственного размера и не мельче его на плотных экранах (D31)', () => {
  it.each(FILES)(
    'файл %i px: дескриптор каждого кандидата — ширина, которую отдаст оптимизатор, он не шире файла',
    (width, height) => {
      const { candidates } = viewerImage(shot(width, height));

      expect(candidates.length).toBeGreaterThan(0);
      for (const { requested, descriptor } of candidates) {
        expect(descriptor).toBe(Math.min(requested, width));
      }
      expect(new Set(candidates.map(({ descriptor }) => descriptor)).size).toBe(candidates.length);
    },
  );

  it.each(FILES)('файл %i px: самый крупный кандидат — файл целиком', (width, height) => {
    const { candidates } = viewerImage(shot(width, height));

    expect(Math.max(...candidates.map(({ descriptor }) => descriptor))).toBe(width);
  });

  it.each(FILES)('файл %i px: `sizes` не шире файла и окна просмотра', (width, height) => {
    const cap = Math.min(width, VIEWER_WIDTH);

    expect(viewerImage(shot(width, height)).sizes).toBe(`(max-width: ${cap}px) 100vw, ${cap}px`);
  });
});

/** `alt` кадра в кнопке сетки — у кнопки своя видимая подпись. */
const shotAlt = (caption: string | null) => {
  const markup = renderToStaticMarkup(
    <PhotoViewer
      label="Галерея"
      photos={[{ ...shot(1600, 1000), alt: 'Всадник у ворот частокола', caption }]}
    />,
  );
  const button = markup.slice(markup.indexOf('<button'), markup.indexOf('</button>'));

  return button.match(/<img [^>]*alt="([^"]*)"/)?.[1];
};

describe('кадр в сетке не повторяет своей подписью `alt` (accessibility 100, D28)', () => {
  it.each([
    ['подписи нет — видна строка `alt`', null],
    ['подпись совпадает с `alt`', 'Всадник у ворот частокола'],
  ])('%s: у картинки пустой `alt`', (_, caption) => {
    expect(shotAlt(caption)).toBe('');
  });

  it('подпись другая: `alt` остается описанием кадра', () => {
    expect(shotAlt('Ворота')).toBe('Всадник у ворот частокола');
  });
});
