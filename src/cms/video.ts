import type { Media, Page } from '@/payload-types';
import { HERO_VIDEO_TYPES } from './consts';
import type { HeroVideoSources } from './types';

/** Адрес файла видео нужного типа; несвязанный, удаленный или файл другого типа — `null`. */
const urlOf = (media: number | Media | null | undefined, mimeType: string) =>
  typeof media === 'object' && media?.mimeType === mimeType && media.url ? media.url : null;

/** Видео первого экрана из группы `hero` страницы; ни одного годного файла — `null`, первый экран остается кадром. */
export const toHeroVideo = (hero: Page['hero'] | null | undefined): HeroVideoSources | null => {
  const mp4 = urlOf(hero?.videoMp4, HERO_VIDEO_TYPES.mp4);
  const webm = urlOf(hero?.videoWebm, HERO_VIDEO_TYPES.webm);

  return mp4 || webm ? { mp4, webm } : null;
};
