import type { GlobalConfig } from 'payload';
import { paragraphsField } from '../fields';
import { validateLinkUrl } from '../validate';

export const Site: GlobalConfig = {
  slug: 'site',
  label: 'Сайт: контакты и возврат',
  fields: [
    { name: 'name', type: 'text', label: 'Название', required: true },
    { name: 'tagline', type: 'text', label: 'Подзаголовок' },
    { name: 'ageNote', type: 'textarea', label: 'Возрастная маркировка' },
    { name: 'address', type: 'text', label: 'Адрес', required: true },
    {
      name: 'map',
      type: 'group',
      label: 'Точка на карте',
      admin: {
        description: 'Куда ставить метку на карте «как доехать» и в карточке события; без точки кнопки карты нет',
      },
      fields: [
        { name: 'latitude', type: 'number', label: 'Широта', min: -90, max: 90 },
        { name: 'longitude', type: 'number', label: 'Долгота', min: -180, max: 180 },
      ],
    },
    { name: 'phone', type: 'text', label: 'Телефон', required: true },
    { name: 'email', type: 'email', label: 'Почта', required: true },
    { name: 'legal', type: 'text', label: 'Юрлицо', admin: { description: 'Строка в подвале' } },
    {
      name: 'socials',
      type: 'array',
      label: 'Соцсети',
      labels: { singular: 'Соцсеть', plural: 'Соцсети' },
      fields: [
        { name: 'label', type: 'text', label: 'Название', required: true },
        { name: 'url', type: 'text', label: 'Адрес', required: true, validate: validateLinkUrl },
      ],
    },
    {
      name: 'refund',
      type: 'group',
      label: 'Возврат билетов',
      admin: { description: 'Инструкция той кассы, в которую ведут кнопки билета' },
      fields: [
        { name: 'title', type: 'text', label: 'Заголовок' },
        paragraphsField('body', 'Условия'),
        { name: 'email', type: 'email', label: 'Куда писать' },
        {
          name: 'details',
          type: 'array',
          label: 'Что указать в письме',
          labels: { singular: 'Пункт', plural: 'Пункты' },
          fields: [{ name: 'text', type: 'text', label: 'Пункт', required: true }],
        },
      ],
    },
  ],
};
