import type { Theme } from '@/lib/types';
import { HERO_THEME_ATTR } from './consts';

/**
 * Кадр первого экрана темы начинает грузиться до смены темы: спрятанный кадр с `loading="lazy"` браузер не качает,
 * а с `eager` качает и спрятанным, поэтому после нажатия кадр уже в кеше.
 */
export const warmHeroPhoto = (theme: Theme) => {
  for (const image of document.querySelectorAll<HTMLImageElement>(`[${HERO_THEME_ATTR}="${theme}"] img`)) {
    image.loading = 'eager';
  }
};
