import Image from 'next/image';
import type { Photo } from '@/cms/types';
import { PhotoNote } from '@/components/PhotoNote';
import { THEMES } from '@/lib/consts';
import type { Theme } from '@/lib/types';
import { HEAD_PHOTO_SIZES } from '../../consts';
import styles from './HeadPhoto.module.scss';

export type HeadPhotoProps = {
  /** Кадры шапки обеих тем: вечерний и дневной. */
  photos: Record<Theme, Photo | null>;
  theme: Theme;
};

/**
 * Кадр шапки справа от текста. Один кадр на обе темы (или кадр только одной) — одна картинка; разные — обе
 * в разметке, кадр второй темы спрятан по `data-theme` и не грузится, пока его не покажут. Кадр текущей темы
 * грузится сразу: на узком окне он в первом экране.
 */
export const HeadPhoto = ({ photos, theme }: HeadPhotoProps) => {
  const shown = THEMES.flatMap((photoTheme) => {
    const photo = photos[photoTheme];

    return photo ? [{ photo, photoTheme }] : [];
  });
  const shared = shown.length < 2 || shown[0].photo.src === shown[1].photo.src;
  const frames = shared ? [shown.find(({ photoTheme }) => photoTheme === theme) ?? shown[0]] : shown;

  if (!frames[0]) {
    return null;
  }

  return (
    <div className={styles.frame}>
      {frames.map(({ photo, photoTheme }) => (
        <div
          key={photoTheme}
          className={styles.photo}
          data-photo-theme={shared ? undefined : photoTheme}
        >
          <Image
            className={styles.image}
            src={photo.src}
            alt={photo.alt}
            sizes={HEAD_PHOTO_SIZES}
            fill
            loading={shared || photoTheme === theme ? 'eager' : 'lazy'}
            fetchPriority={shared || photoTheme === theme ? 'high' : undefined}
          />
          {photo.temporary ? <PhotoNote /> : null}
        </div>
      ))}
    </div>
  );
};
