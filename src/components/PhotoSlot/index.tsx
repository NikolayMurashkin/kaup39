import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Photo } from '@/cms/types';
import { Grain } from '../Grain';
import { Ornament } from '../Ornament';
import styles from './PhotoSlot.module.scss';

export type PhotoSlotProps = {
  /** Кадр из медиатеки CMS. Без него остается процедурная заглушка — градиент плюс зерно. */
  photo?: Photo | null;
  /** Какую ширину кадр занимает на странице: по ней next/image выбирает размер файла. */
  sizes?: string;
  /** Подпись поверх кадра: она лежит на вуали `--veil-ink`, иначе текст тонет в фотографии. */
  caption?: ReactNode;
  /** Лента борре по нижнему краю кадра. */
  band?: boolean;
  className?: string;
};

/**
 * Место под фотографию. Кадр приезжает из медиатеки CMS и ложится поверх процедурной заглушки,
 * которая видна, пока он грузится. Подпись читается не благодаря заглушке, а благодаря вуали:
 * при alpha 0.94 кадр дает под текстом около 6% цвета, и контраст почти не зависит от того, что
 * под ней лежит — разброс между самым светлым и самым темным кадром выходит меньше пункта.
 */
export const PhotoSlot = ({ photo, sizes = '100vw', caption, band = false, className }: PhotoSlotProps) => (
  <div className={[styles.slot, className].filter(Boolean).join(' ')}>
    <div className={styles.fill}>
      <Grain kind="wood" />
    </div>

    {photo ? (
      <Image
        className={styles.image}
        src={photo.src}
        alt={photo.alt}
        sizes={sizes}
        fill
      />
    ) : null}

    {band ? <Ornament className={styles.band} /> : null}

    {caption ? <p className={styles.caption}>{caption}</p> : null}
  </div>
);
