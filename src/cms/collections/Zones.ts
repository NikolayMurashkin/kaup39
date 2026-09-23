import type { CollectionConfig } from 'payload';
import { orderField, paragraphsField, slugField } from '../fields';

export const Zones: CollectionConfig = {
  slug: 'zones',
  labels: { singular: 'Площадка', plural: 'Площадки' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'order'] },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'Название', required: true },
    slugField,
    paragraphsField('description', 'Описание'),
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Фотография' },
    orderField,
  ],
};
