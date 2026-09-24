import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_MEDIA_DIR } from '@/cms/consts';
import { coversOwnersMedia } from '../e2e/seed/guard';

describe('защита засева от медиатеки владельцев', () => {
  it.each(['media', './media', 'media/', 'Media', 'MEDIA', path.resolve(DEFAULT_MEDIA_DIR), '.', '..'])(
    '«%s» совпадает с медиатекой владельцев или содержит ее — засев его не стирает',
    (dir) => {
      expect(coversOwnersMedia(dir)).toBe(true);
    },
  );

  it.each(['media-e2e', './media-e2e', 'media/e2e', path.join(path.sep, 'tmp', 'kaup39-media')])(
    '«%s» — отдельный каталог, засев может его пересоздать',
    (dir) => {
      expect(coversOwnersMedia(dir)).toBe(false);
    },
  );
});
