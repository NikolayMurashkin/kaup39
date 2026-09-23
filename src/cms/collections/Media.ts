import type { CollectionConfig } from 'payload';
import { MEDIA_DIR } from '../consts';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Фотография', plural: 'Медиатека' },
  access: { read: () => true },
  upload: { staticDir: MEDIA_DIR, mimeTypes: ['image/*'] },
  fields: [
    { name: 'alt', type: 'text', label: 'Что на фотографии', required: true },
    { name: 'caption', type: 'text', label: 'Подпись' },
  ],
};
