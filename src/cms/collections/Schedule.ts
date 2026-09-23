import type { CollectionConfig } from 'payload';
import { validateEnd, validateOptionalTime, validateTime } from '../validate';

export const Schedule: CollectionConfig = {
  slug: 'schedule',
  labels: { singular: 'Дата', plural: 'Расписание' },
  admin: { useAsTitle: 'date', defaultColumns: ['date', 'event', 'start', 'end', 'show'] },
  defaultSort: 'date',
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'events', label: 'Событие', required: true, index: true },
    {
      name: 'date',
      type: 'date',
      label: 'День',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } },
    },
    {
      type: 'row',
      fields: [
        { name: 'start', type: 'text', label: 'Начало', required: true, validate: validateTime },
        { name: 'end', type: 'text', label: 'Конец', required: true, validate: validateEnd },
        { name: 'show', type: 'text', label: 'Огненное шоу', validate: validateOptionalTime },
      ],
    },
  ],
};
