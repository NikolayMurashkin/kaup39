import { getImageProps } from 'next/image';
import type { Photo } from '@/cms/types';
import { HERO_WIDE_QUALITY } from '@/lib/images';
import { HERO_NARROW_MEDIA, HERO_POSTER_WIDTH, HERO_SIZES, REDUCED_MOTION_MEDIA } from './consts';
import type { HeroImageProps, HeroVideoEnv } from './types';

/**
 * Видео первого экрана — только шире телефонной колонки, без Save-Data и без «меньше движения» в системе.
 * Браузер без `navigator.connection` (Safari, Firefox) о Save-Data не сообщает — видео есть.
 */
export const canPlayHeroVideo = (env: HeroVideoEnv): boolean =>
  !env.matchMedia(HERO_NARROW_MEDIA).matches &&
  !env.matchMedia(REDUCED_MOTION_MEDIA).matches &&
  env.navigator.connection?.saveData !== true;

/** Широкий источник кадра первого экрана (шире 640 px) — общий для `<img>` кадра и постера видео. */
export const wideHeroImage = (photo: Photo): HeroImageProps =>
  getImageProps({ src: photo.src, alt: photo.alt, fill: true, sizes: HERO_SIZES, quality: HERO_WIDE_QUALITY }).props;

/**
 * Постер видео — кандидат `srcSet` широкого кадра шириной `HERO_POSTER_WIDTH`: тот же файл оптимизатора, что и кадр.
 * Такого кандидата нет — запасной адрес `<img>` того же источника.
 */
export const heroPoster = (photo: Photo): string => {
  const wide = wideHeroImage(photo);
  const candidate = wide.srcSet
    ?.split(', ')
    .map((entry) => entry.split(' '))
    .find(([, descriptor]) => descriptor === `${HERO_POSTER_WIDTH}w`);

  return candidate?.[0] ?? wide.src;
};
