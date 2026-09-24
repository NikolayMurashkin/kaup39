import type { Media } from '@/payload-types';
import type { Photo } from './types';

/** Фотография из медиатеки в том виде, в каком ее рисуют страницы; несвязанная или удаленная — `null`. */
export const toPhoto = (media: number | Media | null | undefined): Photo | null =>
  typeof media === 'object' && media?.url ? { src: media.url, alt: media.alt, caption: media.caption ?? null } : null;
