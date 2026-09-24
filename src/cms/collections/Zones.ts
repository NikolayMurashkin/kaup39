import type { CollectionConfig } from 'payload';
import { ZONE_MARK_LABELS } from '../consts';
import { orderField, paragraphsField, slugField } from '../fields';

export const Zones: CollectionConfig = {
  slug: 'zones',
  labels: { singular: 'Площадка', plural: 'Площадки' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'order'] },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'Название', required: true },
    slugField,
    {
      name: 'mark',
      type: 'select',
      label: 'Знак',
      options: Object.entries(ZONE_MARK_LABELS).map(([value, label]) => ({ value, label })),
      admin: { description: 'Значок на плитке площадки на главной' },
    },
    paragraphsField('description', 'Описание'),
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фотография' },
    orderField,
  ],
};
