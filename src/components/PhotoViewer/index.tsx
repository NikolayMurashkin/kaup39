'use client';

import Image from 'next/image';
import { type KeyboardEvent, type MouseEvent, useRef, useState } from 'react';
import type { Photo } from '@/cms/types';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { PhotoNote } from '../PhotoNote';
import { VIEWER_FALLBACK_SIZE, VIEWER_SIZES } from './consts';
import styles from './PhotoViewer.module.scss';

export type PhotoViewerProps = {
  /** Имя галереи для скринридера. */
  label: string;
  photos: Photo[];
  /** Раскладка кадров-кнопок: мозаику задает страница. */
  className?: string;
  /** Класс каждой клетки по порядку кадров: большая, высокая, широкая. */
  itemClassNames?: string[];
};

/**
 * Галерея с просмотром: кадр-кнопка открывает нативный `<dialog>` с кадром целиком (без обрезки), подписью
 * и счетчиком «3 из 6»; кнопки и стрелки клавиатуры листают по кругу, Esc закрывает, фокус возвращается на кадр.
 * Кадр в просмотре не растягивается больше собственного размера.
 */
export const PhotoViewer = ({ label, photos, className, itemClassNames = [] }: PhotoViewerProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const photo = photos[index];

  const open = (next: number) => (event: MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget;
    setIndex(next);
    dialogRef.current?.showModal();
  };

  const step = (delta: number) => setIndex((current) => (current + delta + photos.length) % photos.length);

  const close = () => dialogRef.current?.close();

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowLeft') {
      step(-1);
    } else if (event.key === 'ArrowRight') {
      step(1);
    }
  };

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      close();
    }
  };

  if (!photo) {
    return null;
  }

  return (
    <>
      <ul
        className={[styles.list, className].filter(Boolean).join(' ')}
        aria-label={label}
      >
        {photos.map((shot, position) => (
          <li
            key={shot.src}
            className={itemClassNames[position]}
          >
            <button
              className={styles.shot}
              type="button"
              aria-haspopup="dialog"
              onClick={open(position)}
            >
              <span className={styles.shotImage}>
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  sizes="(max-width: 640px) 50vw, 33vw"
                  fill
                />
                {shot.temporary ? <PhotoNote /> : null}
              </span>
              <span className={styles.shotCaption}>
                <span>{shot.caption ?? shot.alt}</span>
                <Icon
                  name="plus"
                  className={styles.shotIcon}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className={styles.viewer}
        aria-label={`${label}: просмотр фото`}
        onClose={() => openerRef.current?.focus()}
        onClick={closeOnBackdrop}
        onKeyDown={onKeyDown}
      >
        <div className={styles.stage}>
          <Image
            key={photo.src}
            className={styles.image}
            src={photo.src}
            alt={photo.alt}
            width={photo.width ?? VIEWER_FALLBACK_SIZE.width}
            height={photo.height ?? VIEWER_FALLBACK_SIZE.height}
            sizes={VIEWER_SIZES}
          />
        </div>

        <div className={styles.bar}>
          <p className={styles.caption}>
            {photo.caption ?? photo.alt}
            {photo.temporary ? <PhotoNote className={styles.captionNote} /> : null}
          </p>

          <div className={styles.nav}>
            <IconButton
              icon="prev"
              label="Предыдущий кадр"
              className={styles.button}
              onClick={() => step(-1)}
            />
            <span className={styles.count}>
              {index + 1} из&nbsp;{photos.length}
            </span>
            <IconButton
              icon="arrow"
              label="Следующий кадр"
              className={styles.button}
              onClick={() => step(1)}
            />
            <IconButton
              icon="close"
              label="Закрыть"
              className={styles.button}
              onClick={close}
            />
          </div>
        </div>
      </dialog>
    </>
  );
};
