import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Zones } from '@/app/(site)/_home/Zones';
import { fileOf, media, zone, type Zone } from '../lib/albums';
import { candidatesOf, dialogsOf, imagesOf, showsFile, SLIDER, sliderPart, textOf, tilesOf } from '../lib/markup';

/** Ширина окна просмотра на широком экране. */
const VIEWER_WIDTH = 1180;

const FILES: [number, number][] = [
  [820, 602],
  [1600, 1000],
  [3000, 2000],
];

const PREV = 'aria-label="Предыдущий кадр"';
const NEXT = 'aria-label="Следующий кадр"';

const zones = (list: Zone[]) =>
  renderToStaticMarkup(
    <Zones
      anchor="zones"
      heading="Площадки"
      zones={list}
    />,
  );

const THREE = [media(11), media(12), media(13)];

describe('диалог зоны: слайдер кадров', () => {
  it.each(FILES)('кадр слайдера зоны не больше собственного размера (D31): файл %i px', (width, height) => {
    const shot = media(1, { url: `/api/media/file/shot-${width}.jpg`, width, height });
    const [dialog] = dialogsOf(zones([zone(1, 'Дом ярла', { photo: media(2), gallery: [shot] })]));
    const image = imagesOf(sliderPart(dialog?.html ?? ''))[0];

    expect(image).toBeDefined();

    const candidates = candidatesOf(image);
    const cap = Math.min(width, VIEWER_WIDTH);

    expect(candidates.length).toBeGreaterThan(0);
    for (const { requested, descriptor } of candidates) {
      expect(descriptor).toBe(Math.min(requested, width));
    }
    expect(Math.max(...candidates.map(({ descriptor }) => descriptor))).toBe(width);

    // диалог зоны уже окна просмотра: `sizes` может быть и меньше, но не шире файла и окна просмотра
    const slot = Number(image.sizes.match(/^\(max-width: (\d+)px\) 100vw, (\d+)px$/)?.[2]);

    expect(image.sizes).toBe(`(max-width: ${slot}px) 100vw, ${slot}px`);
    expect(slot).toBeGreaterThan(0);
    expect(slot).toBeLessThanOrEqual(cap);
  });

  it.each([
    ['пустой', []],
    ['null', null],
  ])('зона без кадров — диалог без слайдера (gallery: %s)', (_, gallery) => {
    // рядом зона с кадрами: слайдер в разметке вообще бывает, и нужный диалог без него
    const [withGallery, without] = dialogsOf(
      zones([zone(1, 'Дом ярла', { gallery: THREE }), zone(2, 'Кузня', { photo: media(2), gallery })]),
    );

    expect(withGallery.html).toContain(SLIDER);
    expect(without.html).not.toContain(SLIDER);
    expect(without.html).not.toContain(PREV);
    expect(without.html).not.toContain(NEXT);
    expect(showsFile(imagesOf(without.html)[0], fileOf(2))).toBe(true);
  });

  it('зона с одним кадром — слайдер без кнопок листания и счетчика', () => {
    const [dialog] = dialogsOf(zones([zone(1, 'Дом ярла', { photo: media(2), gallery: [media(11)] })]));
    const slider = sliderPart(dialog.html);

    expect(dialog.html).toContain(SLIDER);
    expect(showsFile(imagesOf(slider)[0], fileOf(11))).toBe(true);
    expect(slider).not.toContain(PREV);
    expect(slider).not.toContain(NEXT);
    expect(textOf(slider)).not.toContain('1 из 1');
  });

  it('зона с тремя кадрами — кнопки листания и «1 из 3»', () => {
    const [dialog] = dialogsOf(zones([zone(1, 'Дом ярла', { photo: media(2), gallery: THREE })]));
    const slider = sliderPart(dialog.html);

    expect(dialog.html).toContain(SLIDER);
    expect(showsFile(imagesOf(slider)[0], fileOf(11))).toBe(true);
    expect(slider).toContain(PREV);
    expect(slider).toContain(NEXT);
    expect(textOf(slider)).toContain('1 из 3');
  });
});

describe('диалог зоны: подпись автора (D31)', () => {
  it('в слайдере зоны под кадром «Фото: <автор>», у кадра без автора подписи нет, на карточке подписи нет', () => {
    const card = media(2, { author: 'Автор карточки' });
    const markup = zones([
      zone(1, 'Дом ярла', { photo: card, gallery: [media(11, { author: 'Роман Большаков' }), media(12)] }),
      zone(2, 'Кузня', { photo: card, gallery: [media(13), media(14)] }),
    ]);
    const [withAuthor, without] = dialogsOf(markup);
    const slider = sliderPart(withAuthor.html);

    expect(textOf(slider.slice(slider.indexOf('<img')))).toContain('Фото: Роман Большаков');
    expect(textOf(without.html)).not.toContain('Фото:');

    for (const { button } of tilesOf(markup)) {
      expect(textOf(button)).not.toContain('Фото:');
    }
  });
});
