import type { Block } from 'payload';
import { anchorField, paragraphsField } from './fields';
import { validateLinkUrl, validateOptionalLinkUrl, validatePhone } from './validate';

const headingField = { name: 'heading', type: 'text' as const, label: 'Заголовок' };

export const TextBlock: Block = {
  slug: 'text',
  labels: { singular: 'Текст', plural: 'Тексты' },
  fields: [
    anchorField,
    headingField,
    paragraphsField('body', 'Текст'),
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фотография' },
  ],
};

export const ListBlock: Block = {
  slug: 'list',
  labels: { singular: 'Список', plural: 'Списки' },
  fields: [
    anchorField,
    headingField,
    paragraphsField('intro', 'Вступление'),
    {
      name: 'items',
      type: 'array',
      label: 'Пункты',
      labels: { singular: 'Пункт', plural: 'Пункты' },
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', label: 'Пункт', required: true },
        { name: 'text', type: 'textarea', label: 'Пояснение' },
        {
          name: 'url',
          type: 'text',
          label: 'Ссылка',
          validate: validateOptionalLinkUrl,
          admin: { description: 'Например, расписание автобуса' },
        },
      ],
    },
    paragraphsField('footnote', 'Примечание'),
  ],
};

export const PricesBlock: Block = {
  slug: 'prices',
  labels: { singular: 'Цены', plural: 'Цены' },
  fields: [
    anchorField,
    headingField,
    paragraphsField('intro', 'Вступление'),
    {
      name: 'rows',
      type: 'array',
      label: 'Строки',
      labels: { singular: 'Строка', plural: 'Строки' },
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', label: 'Что', required: true },
        { name: 'amount', type: 'number', label: 'Цена, ₽', required: true, min: 0 },
        { name: 'unit', type: 'text', label: 'За что', admin: { description: 'Например, «час» или «одно место»' } },
        { name: 'note', type: 'text', label: 'Пояснение' },
      ],
    },
    paragraphsField('footnote', 'Примечание'),
  ],
};

export const LinksBlock: Block = {
  slug: 'links',
  labels: { singular: 'Ссылки', plural: 'Ссылки' },
  fields: [
    anchorField,
    headingField,
    {
      name: 'links',
      type: 'array',
      label: 'Ссылки',
      labels: { singular: 'Ссылка', plural: 'Ссылки' },
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', label: 'Текст', required: true },
        { name: 'url', type: 'text', label: 'Адрес', required: true, validate: validateLinkUrl },
      ],
    },
  ],
};

export const PhotosBlock: Block = {
  slug: 'photos',
  labels: { singular: 'Фотографии', plural: 'Фотографии' },
  fields: [
    anchorField,
    headingField,
    { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, label: 'Фотографии', minRows: 1 },
  ],
};

/** Телефон, по которому звонят со страницы: кемпинг бронируют у своего человека, а не по общему номеру владельцев. */
export const PhoneBlock: Block = {
  slug: 'phone',
  labels: { singular: 'Телефон', plural: 'Телефоны' },
  fields: [
    anchorField,
    headingField,
    paragraphsField('intro', 'Подпись'),
    {
      name: 'phone',
      type: 'text',
      label: 'Номер',
      required: true,
      validate: validatePhone,
      admin: { description: 'Только номер, например 8 906 213-44-55: из него получается ссылка для звонка' },
    },
    { name: 'person', type: 'text', label: 'Кому звонить', admin: { description: 'Например, «Анастасия»' } },
  ],
};
