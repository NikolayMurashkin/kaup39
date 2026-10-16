import type { CorporatePartSpec, CorporateParts } from './types';

/** Заголовок страницы, пока в CMS нет своего. */
export const CORPORATE_TITLE = 'Корпоративы и свадьбы';

/** Руны над заголовками частей, как у артборда. */
export const CORPORATE_KICKERS = {
  head: 'Пир',
  offer: 'Йоль',
  formats: 'Поводы',
  longhouse: 'Чертог',
  fireShow: 'Пламя',
  food: 'Трапеза',
  rent: 'Часы',
  photos: 'Кадры',
  reviews: 'Молва',
  request: 'Весть',
} as const;

/** Часть страницы → раздел CMS, который ее наполняет: якорь и тип блока должны совпасть оба. */
export const CORPORATE_PARTS: Record<Exclude<keyof CorporateParts, 'rest'>, CorporatePartSpec> = {
  newYear: { anchor: 'new-year', blockType: 'text' },
  capacity: { anchor: 'capacity', blockType: 'list' },
  formats: { anchor: 'formats', blockType: 'list' },
  longhouse: { anchor: 'longhouse', blockType: 'text' },
  fireShow: { anchor: 'fire-show', blockType: 'list' },
  food: { anchor: 'food', blockType: 'list' },
  rent: { anchor: 'rent', blockType: 'text' },
  rentPrices: { anchor: 'rent-prices', blockType: 'prices' },
  photos: { anchor: 'corporate-photos', blockType: 'photos' },
  request: { anchor: 'request', blockType: 'text' },
};

/** Заголовки частей, когда в CMS у раздела нет своего; у оффера своего раздела нет — заголовок из артборда. */
export const CORPORATE_HEADINGS = {
  offer: 'Длинный дом вместо ресторана',
  capacity: 'Вместимость',
  rent: 'Аренда поселения',
  photos: 'Фото мероприятий',
  reviews: 'Отзывы гостей',
  request: 'Свяжитесь с нами',
} as const;

/** Подпись строки фактов в первом экране. */
export const FACTS_LABEL = 'длинный дом';

/** Якорь формы заявки, если у раздела заявки в CMS нет своего: на него ведет «Оставить заявку» первого экрана. */
export const REQUEST_ANCHOR = 'request';

export const HERO_ACTIONS = {
  request: 'Оставить заявку',
  call: 'Позвонить',
} as const;

/** Подпись кадра первого экрана: чей он. */
export const PHOTO_CREDIT_PREFIX = 'фото: ';

/** Кадр раздела фото: до 640 px один в ряд во всю ширину, шире — три в ряд, до ~430 px при самом широком контейнере. */
export const SHOT_SIZES = '(max-width: 640px) 100vw, (max-width: 1440px) 33vw, 430px';

/** Хвост подписи числа кадров, когда все кадры раздела — владельцев: «3 кадра владельцев». */
export const OWNERS_SHOTS = 'владельцев';
