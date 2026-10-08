'use client';

import Image from 'next/image';
import type { MouseEvent, ReactNode } from 'react';
import type { Photo } from '@/cms/types';
import { Icon } from '../Icon';
import { PhotoNote } from '../PhotoNote';
import { preloadViewerImage } from '../PhotoSlider/image';
import { SHOT_SIZES } from './consts';
import styles from './PhotoViewer.module.scss';

export type PhotoShotProps = {
  photo: Photo;
  /** `sizes` кадра в клетке: большая клетка мозаики шире обычной. */
  sizes?: string;
  /** Видимая подпись плитки; кнопка называется ею же, поэтому картинка рядом декоративная. */
  caption: ReactNode;
  /** Подпись, которую картинка может повторить: `alt` пустой, когда она совпадает с видимой. */
  captionText?: string | null;
  onOpen: (event: MouseEvent<HTMLButtonElement>) => void;
};

/**
 * `alt` кадра-кнопки: видимая подпись уже называет кадр, и когда она совпадает с `alt` (или сама взята из него),
 * картинка декоративная — иначе кнопка произносит один текст дважды.
 */
const shotAlt = ({ alt }: Photo, caption: string | null | undefined) => (caption && caption !== alt ? alt : '');

/** Кадр-кнопка с подписью и плюсом: открывает окно просмотра, которое родитель ставит следом. */
export const PhotoShot = ({ photo, sizes = SHOT_SIZES, caption, captionText, onOpen }: PhotoShotProps) => (
  <button
    className={styles.shot}
    type="button"
    aria-haspopup="dialog"
    onClick={onOpen}
    onPointerEnter={() => preloadViewerImage(photo)}
    onFocus={() => preloadViewerImage(photo)}
  >
    <span className={styles.shotImage}>
      <Image
        src={photo.src}
        alt={shotAlt(photo, captionText)}
        sizes={sizes}
        fill
      />
      {photo.temporary ? <PhotoNote /> : null}
    </span>
    <span className={styles.shotCaption}>
      <span>{caption}</span>
      <Icon
        name="plus"
        className={styles.shotIcon}
      />
    </span>
  </button>
);
