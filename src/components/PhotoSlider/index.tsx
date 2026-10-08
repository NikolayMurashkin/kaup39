'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { Photo } from '@/cms/types';
import { IconButton } from '../IconButton';
import { PhotoNote } from '../PhotoNote';
import { VIEWER_WIDTH } from './consts';
import { preloadViewerImage, viewerImageProps } from './image';
import styles from './PhotoSlider.module.scss';

export type PhotoSliderProps = {
  /** Имя слайдера для скринридера. */
  label: string;
  photos: Photo[];
  /** Кадр, с которого слайдер начинает; новый показ сбрасывается `key` родителя. */
  initialIndex?: number;
  /** Ширина окна, в котором стоит слайдер: `sizes` кадра не шире нее и не шире файла. */
  windowWidth?: number;
  /** Подложка кадра по номеру, пока грузится полный: уже скачанный файл плитки. */
  placeholders?: string[];
  /** Сцена постоянной высоты (просмотр галереи); без нее окно меняет высоту под кадр. */
  fixedStage?: boolean;
  /** Слайдер внутри окна с полями: подпись без собственных отступов. */
  compact?: boolean;
  /** Подпись кадра, которую не выводить, когда она совпадает с ней (название места над слайдером уже стоит в окне). */
  hiddenCaption?: string;
  /** Кнопки рядом со счетчиком, например «Закрыть» окна просмотра. */
  children?: ReactNode;
};

/**
 * Слайдер кадров: кадр целиком, не больше собственного размера (D31), под ним подпись и «Фото: <автор>», когда автор
 * заполнен (D31). Кнопки, стрелки клавиатуры и счетчик «3 из 6» — только при двух кадрах и больше, листание по кругу;
 * соседние кадры подгружаются заранее.
 */
export const PhotoSlider = ({
  label,
  photos,
  initialIndex = 0,
  windowWidth = VIEWER_WIDTH,
  placeholders = [],
  fixedStage = false,
  compact = false,
  hiddenCaption,
  children,
}: PhotoSliderProps) => {
  const [index, setIndex] = useState(initialIndex);
  const photo = photos[index];
  const many = photos.length > 1;

  const around = (position: number) => (position + photos.length) % photos.length;

  const show = (next: number) => {
    setIndex(next);
    preloadViewerImage(photos[around(next + 1)], windowWidth);
    preloadViewerImage(photos[around(next - 1)], windowWidth);
  };

  const step = (delta: number) => show(around(index + delta));

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || !many) {
      return undefined;
    }

    const target = root.closest('dialog') ?? root;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        step(-1);
      } else if (event.key === 'ArrowRight') {
        step(1);
      }
    };

    target.addEventListener('keydown', onKeyDown as EventListener);

    return () => target.removeEventListener('keydown', onKeyDown as EventListener);
  });

  if (!photo) {
    return null;
  }

  const placeholder = placeholders[index];
  const caption = photo.caption ?? photo.alt;
  const showCaption = caption.trim() !== hiddenCaption?.trim();

  return (
    <div
      className={[styles.slider, compact ? styles.compact : null].filter(Boolean).join(' ')}
      role="group"
      aria-roledescription="слайдер"
      aria-label={label}
      ref={rootRef}
    >
      <div className={[styles.stage, fixedStage ? styles.fixed : null].filter(Boolean).join(' ')}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image не дает поправить дескрипторы srcSet */}
        <img
          key={photo.src}
          {...viewerImageProps(photo, windowWidth)}
          alt={photo.alt}
          className={styles.image}
          style={placeholder ? { backgroundImage: `url("${placeholder}")` } : undefined}
        />
      </div>

      <div className={styles.bar}>
        <div className={styles.info}>
          {showCaption || photo.temporary ? (
            <p className={styles.caption}>
              {showCaption ? caption : null}
              {photo.temporary ? <PhotoNote className={styles.captionNote} /> : null}
            </p>
          ) : null}
          {photo.author ? <p className={styles.author}>Фото: {photo.author}</p> : null}
        </div>

        <div className={styles.nav}>
          {many ? (
            <>
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
            </>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
};
