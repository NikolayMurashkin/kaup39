import { describe, expect, it } from 'vitest';
import { toPhoto } from '@/cms/photo';
import { media } from '../lib/albums';

describe('кадр из медиатеки', () => {
  it('toPhoto: author из медиатеки; пустой и из пробелов — null', () => {
    expect(toPhoto(media(1, { author: 'Роман Большаков' }))?.author).toBe('Роман Большаков');

    for (const author of ['', '  ', null, undefined]) {
      expect(toPhoto(media(1, { author }))?.author).toBeNull();
    }
  });
});
