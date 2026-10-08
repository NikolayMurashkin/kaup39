import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Gallery } from '@/app/(site)/_home/Gallery';
import { album, fileOf, media } from '../lib/albums';
import { candidatesOf, imagesOf, showsFile, textOf, tilesOf, triggersIn } from '../lib/markup';

/** Ширина окна просмотра на широком экране. */
const VIEWER_WIDTH = 1180;

const FILES: [number, number][] = [
  [820, 602],
  [1600, 1000],
  [3000, 2000],
];

const gallery = (albums: ReturnType<typeof album>[]) =>
  renderToStaticMarkup(
    <Gallery
      anchor="gallery"
      heading="Как это выглядит"
      albums={albums}
    />,
  );

/** Бои — три кадра, Пустой — без кадров, Огонь — два кадра и удаленный из медиатеки. */
const ALBUMS = [
  album(1, 'Бои', [media(3), media(1), media(2)]),
  album(2, 'Пустой', []),
  album(3, 'Огонь', [media(5), 7, media(4)]),
];

describe('галерея главной: альбомы', () => {
  it('у каждой плитки свой просмотр: кнопка с обложкой и названием альбома, в его диалоге первый кадр и «1 из N»', () => {
    const markup = gallery(ALBUMS);
    const tiles = tilesOf(markup);

    expect(triggersIn(markup)).toBe(2);
    expect(tiles).toHaveLength(2);

    const [battles, fire] = tiles;

    expect(showsFile(imagesOf(battles.button)[0], fileOf(3))).toBe(true);
    expect(textOf(battles.button)).toContain('Бои');
    expect(battles.dialog.label).toContain('Бои');
    expect(showsFile(imagesOf(battles.dialog.html)[0], fileOf(3))).toBe(true);
    expect(imagesOf(battles.dialog.html)[0]?.loading).toBe('lazy');
    expect(textOf(battles.dialog.html)).toContain('1 из 3');

    expect(textOf(fire.button)).toContain('Огонь');
    expect(fire.dialog.label).toContain('Огонь');
    expect(showsFile(imagesOf(fire.dialog.html)[0], fileOf(5))).toBe(true);
    expect(textOf(fire.dialog.html)).toContain('1 из 2');

    expect(textOf(markup)).not.toContain('Пустой');
  });

  it.each(FILES)('кадр просмотра альбома не больше собственного размера (D31): файл %i px', (width, height) => {
    const shot = media(1, { url: `/api/media/file/shot-${width}.jpg`, width, height });
    const [tile] = tilesOf(gallery([album(1, 'Бои', [shot])]));
    const image = imagesOf(tile?.dialog.html ?? '')[0];

    expect(image).toBeDefined();

    const candidates = candidatesOf(image);
    const cap = Math.min(width, VIEWER_WIDTH);

    expect(candidates.length).toBeGreaterThan(0);
    for (const { requested, descriptor } of candidates) {
      expect(descriptor).toBe(Math.min(requested, width));
    }
    expect(Math.max(...candidates.map(({ descriptor }) => descriptor))).toBe(width);
    expect(image.sizes).toBe(`(max-width: ${cap}px) 100vw, ${cap}px`);
  });

  it('в просмотре альбома под кадром «Фото: <автор>», у кадра без автора подписи нет, на плитках подписи нет', () => {
    const tiles = tilesOf(
      gallery([
        album(1, 'Бои', [media(3, { author: 'Роман Большаков' }), media(1)]),
        album(3, 'Огонь', [media(5), media(4)]),
      ]),
    );

    expect(tiles).toHaveLength(2);

    const [battles, fire] = tiles;
    const afterFrame = (html: string) => textOf(html.slice(html.indexOf('<img')));

    expect(afterFrame(battles.dialog.html)).toContain('Фото: Роман Большаков');
    expect(textOf(fire.dialog.html)).not.toContain('Фото:');
    expect(textOf(battles.button)).not.toContain('Фото:');
    expect(textOf(fire.button)).not.toContain('Фото:');
  });
});
