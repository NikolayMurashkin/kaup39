import type { CollectionConfig } from 'payload';
import { TARIFF_LABELS } from '../consts';
import { paragraphsField, slugField } from '../fields';
import { validateTicketUrl } from '../validate';

const itemsField = (name: string, label: string) => ({
  name,
  type: 'array' as const,
  label,
  labels: { singular: 'Пункт', plural: 'Пункты' },
  fields: [{ name: 'text', type: 'text' as const, label: 'Пункт', required: true }],
});

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Событие', plural: 'События' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'ticketUrl'] },
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true },
    slugField,
    { name: 'ageRating', type: 'text', label: 'Возраст', admin: { description: 'Например, 6+' } },
    { name: 'summary', type: 'textarea', label: 'Коротко', admin: { description: 'Одна-две фразы для карточки' } },
    paragraphsField('description', 'Описание'),
    { name: 'venue', type: 'text', label: 'Площадка' },
    {
      name: 'tariffs',
      type: 'array',
      label: 'Цены',
      labels: { singular: 'Цена', plural: 'Цены' },
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'kind',
          type: 'select',
          label: 'Билет',
          required: true,
          options: Object.entries(TARIFF_LABELS).map(([value, label]) => ({ value, label })),
        },
        { name: 'amount', type: 'number', label: 'Цена, ₽', required: true, min: 0 },
      ],
    },
    itemsField('includes', 'В стоимость билета входит'),
    itemsField('extras', 'За дополнительную плату'),
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, label: 'Галерея' },
    {
      name: 'ticketUrl',
      type: 'text',
      label: 'Ссылка на билет',
      required: true,
      validate: validateTicketUrl,
      admin: { description: 'Только касса Radario: https://radario.ru/…' },
    },
    { name: 'dates', type: 'join', label: 'Даты', collection: 'schedule', on: 'event' },
  ],
};
