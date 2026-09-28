import { CAMPING_PATH, CORPORATE_PATH, DIRECTIONS_PATH } from '@/lib/consts';
import type { MosaicSize, TeaserPage } from './types';

/** Тизеры главной по порядку артборда: вместо разделов кемпинга, аренды и проезда — ссылки на их страницы. */
export const TEASER_PAGES: TeaserPage[] = [
  { slug: 'directions', href: DIRECTIONS_PATH, label: 'как доехать' },
  { slug: 'camping', href: CAMPING_PATH, label: 'кемпинг' },
  { slug: 'corporate', href: CORPORATE_PATH, label: 'корпоративы, свадьбы, аренда' },
];

/** Подпись ссылки тизера, когда в CMS ее нет. */
export const TEASER_ACTION = 'Подробнее';

/** Сколько пунктов «что входит» стоит на карточке события. */
export const EVENT_FACTS_LIMIT = 3;

/** Подпись цены, когда сезон закрыт: цены из CMS — прошлого сезона. */
export const PAST_SEASON_NOTE = 'цены прошлого сезона';

export const DATES_FORMS = ['дата', 'даты', 'дат'] as const;

export const POSITIONS_FORMS = ['позиция', 'позиции', 'позиций'] as const;

export const SHOTS_FORMS = ['кадр', 'кадра', 'кадров'] as const;

/**
 * Мозаика галереи по шесть кадров, как на артборде: 12 клеток — три строки на четырех колонках и шесть на двух.
 * Хвост короче шести тоже занимает целые строки при любом из двух чисел колонок.
 */
export const MOSAIC_BLOCK: MosaicSize[] = ['big', 'tall', '', '', 'wide', 'wide'];

export const MOSAIC_TAILS: Record<number, MosaicSize[]> = {
  1: ['full'],
  2: ['wide', 'wide'],
  3: ['wide', '', ''],
  4: ['', '', '', ''],
  5: ['big', 'tall', '', '', 'full'],
};

/** Руны над заголовками разделов — слова артборда v2: подпись направления, а не текст владельцев. */
export const KICKERS = {
  firstScreen: 'Эпоха викингов',
  events: 'Афиша',
  about: 'История',
  zones: 'Ремесла',
  kitchen: 'Таверны',
  gallery: 'Кадры',
  trip: 'В дорогу',
};

/** Заголовки разделов, когда раздела с таким якорем в CMS нет, — с артборда v2. */
export const FALLBACK_HEADINGS = {
  events: 'События сезона',
  zones: 'Площадки поселения',
  kitchen: 'Средневековая кухня',
  gallery: 'Как это выглядит',
  trip: 'Спланируйте поездку',
};

/** Кадр карточки события: колонка сетки не шире половины контейнера, на телефоне — во всю ширину. */
export const EVENT_PHOTO_SIZES = '(max-width: 640px) 100vw, 664px';

/** Кадр кухни — половина полосы во всю ширину окна, на узком окне — вся полоса. */
export const KITCHEN_PHOTO_SIZES = '(max-width: 1279px) 100vw, 50vw';

/** Миниатюра таверны в строке списка. */
export const TAVERN_THUMB_SIZES = '112px';

/** Кадр таверны в диалоге: окно не шире 760 px. */
export const TAVERN_DIALOG_SIZES = '(max-width: 760px) 100vw, 760px';

/** Кадр тизера: широкий тизер — до двух третей контейнера, на телефоне — во всю ширину. */
export const TEASER_PHOTO_SIZES = '(max-width: 640px) 100vw, 780px';

/** `sizes` кадра клетки мозаики: четыре колонки по 332 px от 1280, две колонки во всю ширину до 1279. */
export const MOSAIC_SIZES: Record<MosaicSize, string> = {
  big: '(max-width: 1279px) 100vw, 664px',
  wide: '(max-width: 1279px) 100vw, 664px',
  full: '(max-width: 1279px) 100vw, 1328px',
  tall: '(max-width: 1279px) 50vw, 332px',
  '': '(max-width: 1279px) 50vw, 332px',
};
