import type { CollectionConfig } from 'payload';
import { LinksBlock, ListBlock, PhotosBlock, PricesBlock, TextBlock } from '../blocks';
import { PAGE_LABELS } from '../consts';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Страница', plural: 'Страницы' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug'] },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true },
    {
      name: 'slug',
      type: 'select',
      label: 'Страница сайта',
      required: true,
      unique: true,
      options: Object.entries(PAGE_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'lead', type: 'textarea', label: 'Подзаголовок' },
    {
      name: 'hero',
      type: 'group',
      label: 'Первый экран',
      admin: { description: 'Кадр под заголовком: вечерний для темной темы, дневной для светлой' },
      fields: [
        { name: 'photoNight', type: 'upload', relationTo: 'media', label: 'Вечерний кадр' },
        { name: 'photoDay', type: 'upload', relationTo: 'media', label: 'Дневной кадр' },
      ],
    },
    {
      name: 'sections',
      type: 'blocks',
      label: 'Разделы',
      labels: { singular: 'Раздел', plural: 'Разделы' },
      blocks: [TextBlock, ListBlock, PricesBlock, LinksBlock, PhotosBlock],
    },
  ],
};
