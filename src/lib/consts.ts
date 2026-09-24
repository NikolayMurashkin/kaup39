import { HOME_ANCHORS } from '@/cms/consts';

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

const CORPORATE_PATH = '/korporativy';

export const EVENT_PATH = '/sobytiya';

export const NAV_LINKS = [
  { href: SCHEDULE_PATH, label: 'Расписание и\u00a0цены' },
  { href: DIRECTIONS_PATH, label: 'Как доехать' },
  { href: CORPORATE_PATH, label: 'Корпоративы' },
  { href: `/#${HOME_ANCHORS.camping}`, label: 'Кемпинг' },
];
