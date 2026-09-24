import type { Theme } from '@/lib/types';

/** Год в секундах: выбор темы переживает закрытие браузера. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Подпись кнопки называет тему, на которую она переключит. */
export const THEME_LABELS: Record<Theme, string> = {
  dark: 'Включить темную тему',
  light: 'Включить светлую тему',
};
