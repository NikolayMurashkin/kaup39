import type { Access, CollectionConfig } from 'payload';

const signedIn: Access = ({ req }) => Boolean(req.user);

/**
 * Отзывы гостей для страницы корпоративов. Только настоящие, от владельцев: пока коллекция пуста, раздела отзывов
 * на странице нет. Читать может любой, писать — только пользователь админки.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Отзыв', plural: 'Отзывы' },
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'occasion', 'createdAt'],
    description: 'Только настоящие отзывы гостей. Пока отзывов нет, раздела на странице корпоративов нет',
  },
  access: { read: () => true, create: signedIn, update: signedIn, delete: signedIn },
  defaultSort: '-createdAt',
  fields: [
    { name: 'author', type: 'text', label: 'Автор', required: true },
    { name: 'text', type: 'textarea', label: 'Отзыв', required: true },
    {
      name: 'occasion',
      type: 'text',
      label: 'Повод',
      admin: { description: 'Что праздновали: корпоратив, свадьба. Необязательно' },
    },
  ],
};
