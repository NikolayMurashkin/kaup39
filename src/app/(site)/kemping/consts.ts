import type { CampingPartSpec, CampingParts } from './types';

/** Заголовок страницы, пока в CMS нет своего. */
export const CAMPING_TITLE = 'Кемпинг';

export const CAMPING_KICKERS = {
  head: 'Ночлег',
  prices: 'Плата',
  services: 'Обиход',
  photos: 'Кадры',
  booking: 'Зов',
} as const;

/** Часть страницы → раздел CMS, который ее наполняет: якорь и тип блока должны совпасть оба. */
export const CAMPING_PARTS: Record<Exclude<keyof CampingParts, 'rest'>, CampingPartSpec> = {
  description: { anchor: 'camping', blockType: 'text' },
  prices: { anchor: 'camping-prices', blockType: 'prices' },
  services: { anchor: 'camping-services', blockType: 'list' },
  photos: { anchor: 'camping-photos', blockType: 'photos' },
  booking: { anchor: 'camping-booking', blockType: 'phone' },
};

/** Сколько строк цен попадает в строку фактов шапки. */
export const FACTS_ROWS = 2;

/** Подпись строки фактов в шапке. */
export const FACTS_LABEL = 'аренда места';

/** Заголовки частей, когда в CMS у раздела нет своего. */
export const CAMPING_HEADINGS = {
  photos: 'Фото кемпинга',
  booking: 'Бронирование',
} as const;

/** Подпись панели бронирования, когда раздела «Телефон» нет и звонят по общему номеру владельцев. */
export const BOOKING_INTRO = 'Подробности и бронирование по телефону';

export const SCHEDULE_LINK_LABEL = 'Даты мероприятий';

/**
 * Кадр шапки: уже ~1150 px окна шапка в одну колонку и кадр во всю ширину, шире кадр встает справа и растет
 * с 440 до ~575 px при самом широком контейнере страницы.
 */
export const HEAD_PHOTO_SIZES = '(max-width: 1150px) 100vw, 575px';

/** Кадр раздела фото: до 640 px один в ряд во всю ширину, шире — три в ряд, до ~430 px при самом широком контейнере. */
export const SHOT_SIZES = '(max-width: 640px) 100vw, (max-width: 1440px) 33vw, 430px';
