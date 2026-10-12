import type { DirectionsPartSpec, DirectionsParts } from './types';

/** Заголовок страницы, пока в CMS нет своего. */
export const DIRECTIONS_TITLE = 'Как доехать';

export const DIRECTIONS_KICKERS = {
  head: 'Путь',
  transfer: 'Обоз',
  car: 'Стоянка',
  bus: 'Дороги',
} as const;

/** Часть страницы → раздел CMS, который ее наполняет: якорь и тип блока должны совпасть оба. */
export const DIRECTIONS_PARTS: Record<Exclude<keyof DirectionsParts, 'rest'>, DirectionsPartSpec> = {
  car: { anchor: 'car', blockType: 'text' },
  maps: { anchor: 'maps', blockType: 'links' },
  bus: { anchor: 'bus', blockType: 'list' },
  transfer: { anchor: 'transfer', blockType: 'text' },
  stops: { anchor: 'transfer-stops', blockType: 'list' },
  price: { anchor: 'transfer-price', blockType: 'prices' },
  rules: { anchor: 'transfer-rules', blockType: 'list' },
  ticket: { anchor: 'transfer-ticket', blockType: 'links' },
};

/** Подпись ссылки у рейсового автобуса: в CMS у пункта только адрес. */
export const BUS_LINK_LABEL = 'Расписание';

/** Кадр в поле раздела: до 1279 px поле во всю ширину окна, шире — не больше колонки поля. */
export const FIELD_PHOTO_SIZES = '(max-width: 1279px) 100vw, 930px';
