import type { CollectionConfig } from 'payload';
import { slugField } from '../fields';

export const Albums: CollectionConfig = {
  slug: 'albums',
  labels: { singular: 'Альбом', plural: 'Альбомы' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'order'] },
  defaultSort: 'order',
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true },
    slugField,
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Кадры',
      admin: { description: 'Первый кадр — обложка плитки галереи на главной' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядок',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Меньше — выше. Место плитки на главной зависит и от формы обложки: вертикальные и горизонтальные обложки раскладываются по своим клеткам, порядок держится среди обложек одной формы',
      },
    },
  ],
};
