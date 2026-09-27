import { describe, expect, it } from 'vitest';
import type { PhotoRecord, PhotoRegistry } from '../../scripts/content-types';
import { mediaData } from '../../scripts/media-data.mts';

const record = (file: string, basis: PhotoRecord['basis']): PhotoRecord => ({
  file,
  source: basis === 'owners' ? 'https://vk.com/wall-1_1' : 'https://example.com/page',
  author: basis === 'owners' ? 'владельцы' : 'неизвестен',
  basis,
  subject: 'кадр для теста',
  slots: [],
});

/** Придуманный реестр: кадр владельцев, кадр с согласием автора и временный чужой кадр. */
const REGISTRY: PhotoRegistry = {
  photos: [record('own.jpg', 'owners'), record('consent.jpg', 'consent'), record('temp.jpg', 'temporary')],
  noPhoto: [],
  noBetterPhoto: [],
};

describe('импорт медиатеки: отметка временного кадра (D31)', () => {
  it('основание `temporary` в реестре становится отметкой временного кадра', () => {
    expect(mediaData({ file: 'temp.jpg', alt: 'Шатер', caption: 'Праздник' }, REGISTRY)).toEqual({
      alt: 'Шатер',
      caption: 'Праздник',
      temporary: true,
    });
  });

  it.each(['own.jpg', 'consent.jpg'])('%s — не временный кадр', (file) => {
    expect(mediaData({ file, alt: 'Кадр' }, REGISTRY).temporary).toBe(false);
  });

  it('повторный импорт снимает отметку, если кадр в реестре заменили кадром владельцев', () => {
    const replaced: PhotoRegistry = { ...REGISTRY, photos: [record('temp.jpg', 'owners')] };

    expect(mediaData({ file: 'temp.jpg', alt: 'Шатер' }, replaced).temporary).toBe(false);
  });
});
