import type { CollectionConfig, UploadField } from 'payload';
import { LinksBlock, ListBlock, PhoneBlock, PhotosBlock, PricesBlock, TextBlock } from '../blocks';
import { HERO_VIDEO_TYPES, PAGE_LABELS } from '../consts';

/**
 * Файл видео первого экрана одного формата. Payload сверяет `filterOptions` и при сохранении: файл другого типа
 * поле не примет. Видео рисует только главная → в админке поле видно только у нее.
 */
const heroVideoField = (name: string, label: string, mimeType: string): UploadField => ({
  name,
  type: 'upload',
  relationTo: 'media',
  label,
  filterOptions: { mimeType: { equals: mimeType } },
  admin: {
    condition: (data) => data?.slug === 'home',
    description:
      'Петля 10–20 секунд без звука поверх кадра, шире телефона. Нужны оба формата: MP4 (H.264) и WebM. Без файла первый экран остается кадром',
  },
});

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
        heroVideoField('videoMp4', 'Видео первого экрана, MP4 (H.264)', HERO_VIDEO_TYPES.mp4),
        heroVideoField('videoWebm', 'Видео первого экрана, WebM', HERO_VIDEO_TYPES.webm),
      ],
    },
    {
      name: 'teaser',
      type: 'group',
      label: 'Карточка на главной',
      admin: {
        description: 'Карточка страницы на главной: без заголовка и текста встают заголовок и подзаголовок страницы',
      },
      fields: [
        { name: 'title', type: 'text', label: 'Заголовок' },
        { name: 'text', type: 'textarea', label: 'Текст' },
        {
          name: 'action',
          type: 'text',
          label: 'Подпись ссылки',
          admin: { description: 'Например, «Форматы и заявка»' },
        },
        { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фотография' },
      ],
    },
    {
      name: 'sections',
      type: 'blocks',
      label: 'Разделы',
      labels: { singular: 'Раздел', plural: 'Разделы' },
      blocks: [TextBlock, ListBlock, PricesBlock, LinksBlock, PhotosBlock, PhoneBlock],
    },
  ],
};
