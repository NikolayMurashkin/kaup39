import type { ReactNode } from 'react';
import { Grain } from '../Grain';
import { Ornament } from '../Ornament';
import styles from './PhotoSlot.module.scss';

export type PhotoSlotProps = {
  /** Подпись поверх кадра: она лежит на вуали `--veil-ink`, иначе текст тонет в фотографии. */
  caption?: ReactNode;
  /** Лента борре по нижнему краю кадра. */
  band?: boolean;
  className?: string;
};

/**
 * Место под фотографию. Сам кадр приезжает из медиатеки CMS и в репозиторий не попадает,
 * поэтому здесь стоит процедурная заглушка: градиент плюс зерно. Подпись читается не благодаря
 * заглушке, а благодаря вуали: при alpha 0.94 кадр дает под текстом около 6% цвета, и контраст
 * почти не зависит от того, что под ней лежит — разброс между самым светлым и самым темным
 * кадром выходит меньше пункта.
 */
export const PhotoSlot = ({ caption, band = false, className }: PhotoSlotProps) => (
  <div className={[styles.slot, className].filter(Boolean).join(' ')}>
    <div className={styles.fill}>
      <Grain kind="wood" />
    </div>

    {band ? <Ornament className={styles.band} /> : null}

    {caption ? <p className={styles.caption}>{caption}</p> : null}
  </div>
);
