import { HOME_ANCHORS } from '@/cms/consts';
import { CAMPING_PATH, CORPORATE_PATH, DIRECTIONS_PATH } from '@/lib/consts';
import type { MosaicBand, MosaicSize, TeaserPage } from './types';

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
 * Полосы мозаики галереи. Каждая целиком заполняет свои строки и на четырех, и на двух колонках, поэтому любые полосы
 * подряд дают сетку без пустых клеток. Вертикальный кадр встает только в высокую клетку, горизонтальный — в большую,
 * обычную или широкую; полосы с ценой больше нуля режут кадр и берутся, только когда без обрезки не собрать.
 * Порядок — предпочтение: первая — раскладка артборда.
 */
export const MOSAIC_BANDS: MosaicBand[] = [
  {
    cells: [
      ['big', 'landscape'],
      ['tall', 'portrait'],
      ['', 'landscape'],
      ['', 'landscape'],
      ['wide', 'landscape'],
      ['wide', 'landscape'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['big', 'landscape'],
      ['tall', 'portrait'],
      ['tall', 'portrait'],
      ['wide', 'landscape'],
      ['wide', 'landscape'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['big', 'landscape'],
      ['wide', 'landscape'],
      ['wide', 'landscape'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['tall', 'portrait'],
      ['tall', 'portrait'],
      ['big', 'landscape'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['tall', 'portrait'],
      ['tall', 'portrait'],
      ['wide', 'landscape'],
      ['wide', 'landscape'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['big', 'landscape'],
      ['big', 'landscape'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['', 'landscape'],
      ['', 'landscape'],
      ['', 'landscape'],
      ['', 'landscape'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['wide', 'landscape'],
      ['wide', 'landscape'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['tall', 'portrait'],
      ['tall', 'portrait'],
      ['tall', 'portrait'],
      ['tall', 'portrait'],
    ],
    cost: 0,
  },
  {
    cells: [
      ['tall', 'portrait'],
      ['big', 'landscape'],
      ['tall', 'landscape'],
    ],
    cost: 2,
  },
  { cells: [['full', 'landscape']], cost: 3 },
  {
    cells: [
      ['big', 'portrait'],
      ['big', 'portrait'],
    ],
    cost: 6,
  },
  { cells: [['full', 'portrait']], cost: 8 },
];

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

/** Кадр кухни — половина полосы во всю ширину окна (рамка главной не шире 1920 px), на узком окне — вся полоса. */
export const KITCHEN_PHOTO_SIZES = '(max-width: 1279px) 100vw, (max-width: 1920px) 50vw, 960px';

/** Миниатюра таверны в строке списка. */
export const TAVERN_THUMB_SIZES = '112px';

/** Кадр таверны в диалоге: окно не шире 760 px. */
export const TAVERN_DIALOG_SIZES = '(max-width: 760px) 100vw, 760px';

/** Кадр тизера: широкий тизер — до двух третей контейнера, на телефоне — во всю ширину. */
export const TEASER_PHOTO_SIZES = '(max-width: 640px) 100vw, 780px';

/**
 * Высота высокой клетки мозаики — две строки и зазор: на телефоне 2 × 156 + 14 px, до 1279 — в долях окна
 * (строка — 0,37 ширины поля без зазора), шире — 2 × 232 + 24 px.
 */
export const TALL_CELL_HEIGHT = { phone: 326, tablet: 70, wide: 488 };

/** `sizes` кадра клетки мозаики: четыре колонки по 332 px от 1280, две колонки во всю ширину до 1279. */
export const MOSAIC_SIZES: Record<MosaicSize, string> = {
  big: '(max-width: 1279px) 100vw, 664px',
  wide: '(max-width: 1279px) 100vw, 664px',
  full: '(max-width: 1279px) 100vw, 1328px',
  tall: '(max-width: 1279px) 50vw, 332px',
  '': '(max-width: 1279px) 50vw, 332px',
};

/** Якоря разделов, которые главная рисует сама: в «другие разделы» CMS они не попадают. */
export const EXTRA_SECTIONS_SKIP = Object.values(HOME_ANCHORS);
