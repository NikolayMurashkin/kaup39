import type { FirstScreenSize } from './types';

/** Широкий источник кадра (шире 640 px): во всю ширину окна, но не шире рамки главной — 1920 px. */
export const HERO_SIZES = '(max-width: 1920px) 100vw, 1920px';

/**
 * Высота плашки до 640 px — как `min-height` в `FirstScreen.module.scss`: на весь экран без шапки (`--header-h`
 * до 1279 px — 60px; в `sizes` нет `var()`) или ниже, у внутренней страницы.
 */
export const HERO_NARROW_HEIGHTS: Record<FirstScreenSize, string> = {
  screen: '(100svh - 60px)',
  page: 'clamp(480px, 74svh, 760px)',
};

/** Телефонная колонка — до 640 px включительно, как медиазапрос направления. */
export const HERO_NARROW_MEDIA = '(max-width: 640px)';

/** Все, что шире телефонной колонки: только для предзагрузки, в верстке это источник `<img>` по умолчанию. */
export const HERO_WIDE_MEDIA = 'not all and (max-width: 640px)';

/** Атрибут `<picture>` с темой кадра: по нему CSS прячет кадр второй темы, а переключатель темы греет его заранее. */
export const HERO_THEME_ATTR = 'data-hero-theme';

/** Подпись ближайшей даты в плашке, если страница не задала свою. */
export const NEXT_LABEL = 'ближайшее';

/** «Меньше движения» в настройках системы: видео первого экрана не включается. */
export const REDUCED_MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

/**
 * Ширина кандидата широкого кадра, который служит постером видео: шире 1920 px кадр не рисуется (`HERO_SIZES`),
 * а файл этой ширины браузер уже взял для кадра на большинстве экранов — постер не качается заново.
 */
export const HERO_POSTER_WIDTH = 1920;

/** Доступное название кнопки паузы называет действие, которое она сделает. */
export const HERO_VIDEO_LABELS = {
  pause: 'Остановить видео',
  play: 'Включить видео',
} as const;
