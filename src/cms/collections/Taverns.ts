import type { CollectionConfig } from 'payload';
import { orderField, paragraphsField, slugField } from '../fields';

export const Taverns: CollectionConfig = {
  slug: 'taverns',
  labels: { singular: 'Таверна', plural: 'Таверны' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'order'] },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'Название', required: true },
    slugField,
    paragraphsField('description', 'Описание'),
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фотография' },
    orderField,
    {
      name: 'menu',
      type: 'array',
      label: 'Меню',
      labels: { singular: 'Раздел меню', plural: 'Разделы меню' },
      fields: [
        { name: 'title', type: 'text', label: 'Раздел' },
        {
          name: 'items',
          type: 'array',
          label: 'Блюда',
          labels: { singular: 'Блюдо', plural: 'Блюда' },
          minRows: 1,
          fields: [
            { name: 'name', type: 'text', label: 'Блюдо', required: true },
            { name: 'note', type: 'text', label: 'Пояснение' },
            {
              type: 'row',
              fields: [
                { name: 'price', type: 'number', label: 'Цена, ₽', required: true, min: 0 },
                {
                  name: 'priceTo',
                  type: 'number',
                  label: 'До, ₽',
                  min: 0,
                  admin: { description: 'Если цена — вилка' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
