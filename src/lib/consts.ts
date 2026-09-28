import type { TariffKind } from '@/cms/types';
import type { NavLink } from './types';

export const THEME_COOKIE = 'theme';

export const THEMES = ['dark', 'light'] as const;

/** Темная тема — основная, светлая вторая. */
export const DEFAULT_THEME = 'dark';

export const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** Заголовки месяцев в расписании и в его фильтре. */
export const MONTHS_NOMINATIVE = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];

/** С воскресенья: так считает `Date.getUTCDay()`. */
export const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

/** Короткие слова, после которых типограф ставит неразрывный пробел. */
export const SHORT_WORDS = [
  'а',
  'в',
  'во',
  'и',
  'к',
  'ко',
  'о',
  'об',
  'с',
  'со',
  'у',
  'на',
  'не',
  'ни',
  'по',
  'до',
  'за',
  'из',
  'от',
  'для',
];

/** Адреса страниц демо. Страницы, которых еще нет, появятся своими блоками по этим же адресам. */
export const SCHEDULE_PATH = '/raspisanie';

export const DIRECTIONS_PATH = '/kak-doehat';

export const CAMPING_PATH = '/kemping';

export const CORPORATE_PATH = '/korporativy';

export const EVENT_PATH = '/sobytiya';

/** Страницы двух событий: в шапке их раскрывает пункт «События», в подвале и меню они идут списком. */
export const EVENT_LINKS: NavLink[] = [
  { href: `${EVENT_PATH}/denvikingi`, label: 'День с\u00a0викингами', note: 'днем' },
  { href: `${EVENT_PATH}/ragnarek`, label: 'Рагнарек', note: 'вечер и\u00a0огненное представление' },
];

/** Пункты шапки от 1280 по артборду v2: «События» стоит вторым и раскрывает `EVENT_LINKS`. */
export const HEADER_LINKS: { before: NavLink[]; after: NavLink[] } = {
  before: [{ href: SCHEDULE_PATH, label: 'Расписание и\u00a0цены' }],
  after: [
    { href: DIRECTIONS_PATH, label: 'Как доехать' },
    { href: CAMPING_PATH, label: 'Кемпинг' },
    { href: CORPORATE_PATH, label: 'Корпоративы' },
  ],
};

/** Шесть страниц демо (D30) по порядку шапки — так их перечисляют подвал и меню. */
export const SITE_PAGES: NavLink[] = [
  ...HEADER_LINKS.before,
  ...EVENT_LINKS,
  ...HEADER_LINKS.after.map((link) =>
    link.href === CORPORATE_PATH ? { ...link, label: 'Корпоративы и\u00a0аренда' } : link,
  ),
];

/**
 * `SITE_ENV` стенда `kaup39.mrshkn.com` (D27): закрывает демо от индексации и прячет витрину компонентов.
 * Задается окружением, а не сборкой — та же сборка без него индексацию не закрывает, и Lighthouse CI меряет SEO
 * настоящей страницы.
 */
export const STAND_SITE_ENV = 'stand';

export const STAND_ROBOTS_TAG = 'noindex, nofollow';

/** Строка подвала каждой страницы демо (D15, D27). */
export const DEMO_NOTE = 'Демо-версия сайта от студии MRSHKN';

/** Подпись под ценой: какой билет стоит столько. */
export const TARIFF_NOTES: Record<TariffKind, string> = {
  entry: 'входной билет',
  adult: 'взрослый билет',
  child: 'детский билет',
  family22: 'семейный, 2 + 2',
  family21: 'семейный, 2 + 1',
};
