import type {
  Access,
  CollectionConfig,
  CollectionSlug,
  NumberFieldSingleValidation,
  RelationshipFieldSingleValidation,
} from 'payload';
import { number, relationship } from 'payload/shared';
import { slugField } from '../fields';

const signedIn: Access = ({ req }) => Boolean(req.user);

/** Точка открывает окно площадки или таверны — связь с другой коллекцией ей не к чему. */
const LINKED: CollectionSlug[] = ['zones', 'taverns'];

/** Связь только с площадкой или таверной: Payload сам коллекцию полиморфной связи не сверяет. */
const validateLink: RelationshipFieldSingleValidation = (value, options) => {
  const target = typeof value === 'object' && value !== null && 'relationTo' in value ? value.relationTo : null;

  return target && !LINKED.includes(target) ? 'Только площадка или таверна' : relationship(value, options);
};

/** Номер метки на рисунке: целое число от 1, как на рисунке владельцев. */
const validateWholeNumber: NumberFieldSingleValidation = (value, options) => {
  const result = number(value, options);

  return result === true && typeof value === 'number' && !Number.isInteger(value) ? 'Только целое число' : result;
};

/** Координата метки — доля рисунка в процентах: вне 0–100 точка ушла бы за край карты. */
const percentField = (name: 'x' | 'y', label: string, description: string) =>
  ({
    name,
    type: 'number',
    label,
    required: true,
    min: 0,
    max: 100,
    admin: { step: 0.01, description },
  }) as const;

/**
 * Точки карты поселения на главной: номер и название, место на рисунке в процентах, связь с площадкой или таверной
 * (тогда точка открывает их окно) и свой кадр для точки без связи. Читать может любой, писать — только пользователь
 * админки.
 */
export const MapPoints: CollectionConfig = {
  slug: 'map-points',
  labels: { singular: 'Точка карты', plural: 'Карта поселения' },
  admin: { useAsTitle: 'name', defaultColumns: ['number', 'name', 'link'] },
  access: { read: () => true, create: signedIn, update: signedIn, delete: signedIn },
  defaultSort: 'number',
  fields: [
    {
      name: 'number',
      type: 'number',
      label: 'Номер',
      required: true,
      min: 1,
      validate: validateWholeNumber,
      admin: { step: 1, description: 'Номер на рисунке; у двух точек может быть один номер' },
    },
    { name: 'name', type: 'text', label: 'Название', required: true },
    slugField,
    {
      type: 'row',
      fields: [
        percentField('x', 'Слева, %', 'От левого края рисунка, 0–100'),
        percentField('y', 'Сверху, %', 'От верхнего края рисунка, 0–100'),
      ],
    },
    {
      name: 'link',
      type: 'relationship',
      relationTo: LINKED,
      validate: validateLink,
      label: 'Площадка или таверна',
      admin: { description: 'Точка откроет окно этой площадки или таверны. Пусто — окно с названием и фото точки' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Фотография',
      admin: { description: 'Только кадр этого места. Нужна точке без площадки и таверны' },
    },
  ],
};
