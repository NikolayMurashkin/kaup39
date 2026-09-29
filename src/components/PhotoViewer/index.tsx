'use client';

import Image, { getImageProps } from 'next/image';
import { type KeyboardEvent, type MouseEvent, useRef, useState } from 'react';
import type { Photo } from '@/cms/types';
import { fitSrcSet } from '@/lib/images';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { Modal } from '../Modal';
import { useModal } from '../Modal/useModal';
import { PhotoNote } from '../PhotoNote';
import { SHOT_SIZES, VIEWER_FALLBACK_SIZE, VIEWER_WIDTH } from './consts';
import styles from './PhotoViewer.module.scss';

export type PhotoViewerProps = {
  /** Имя галереи для скринридера. */
  label: string;
  photos: Photo[];
  /** Раскладка кадров-кнопок: мозаику задает страница. */
  className?: string;
  /** Класс каждой клетки по порядку кадров: большая, высокая, широкая. */
  itemClassNames?: string[];
  /** `sizes` кадра каждой клетки по порядку: большая клетка мозаики шире обычной. */
  itemSizes?: string[];
};

/**
 * Кадр просмотра не шире файла и окна: `sizes` ограничен шириной файла, а дескрипторы `srcSet` — тем, что отдаст
 * оптимизатор, иначе на плотном экране браузер нарисовал бы файл 1600 px шириной около 500.
 */
const viewerImageProps = ({ src, alt, width, height }: Photo) => {
  const fileWidth = width ?? VIEWER_FALLBACK_SIZE.width;
  const cap = Math.min(fileWidth, VIEWER_WIDTH);
  const { props } = getImageProps({
    src,
    alt,
    width: fileWidth,
    height: height ?? VIEWER_FALLBACK_SIZE.height,
    sizes: `(max-width: ${cap}px) 100vw, ${cap}px`,
  });

  return width && props.srcSet ? { ...props, srcSet: fitSrcSet(props.srcSet, width) } : props;
};

/** Кадр просмотра грузится заранее: браузер кладет его в кеш, и `<img>` просмотра берет его оттуда. */
const preloadViewerImage = (photo: Photo | undefined) => {
  if (!photo) {
    return;
  }

  const { src, srcSet, sizes } = viewerImageProps(photo);
  const image = new window.Image();

  image.sizes = sizes ?? '';
  image.srcset = srcSet ?? '';
  image.src = src;
};

/**
 * `alt` кадра-кнопки: видимая подпись уже называет кадр, и когда она совпадает с `alt` (или сама взята из него),
 * картинка декоративная — иначе кнопка произносит один текст дважды.
 */
const shotAlt = ({ alt, caption }: Photo) => (caption && caption !== alt ? alt : '');

/**
 * Галерея с просмотром: кадр-кнопка открывает нативный `<dialog>` с кадром целиком (без обрезки), подписью
 * и счетчиком «3 из 6»; кнопки и стрелки клавиатуры листают по кругу, Esc закрывает, фокус возвращается на кадр.
 * Кадр в просмотре не растягивается больше собственного размера.
 */
export const PhotoViewer = ({ label, photos, className, itemClassNames = [], itemSizes = [] }: PhotoViewerProps) => {
  const { ref: modalRef, open: openModal, close: closeModal, restoreFocus } = useModal();
  const [index, setIndex] = useState(0);
  /** Файлы кадров галереи, которые браузер уже скачал: подложка кадра просмотра, пока грузится полный. */
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const listRef = useRef<HTMLUListElement>(null);
  const photo = photos[index];
  const placeholder = placeholders[index];

  const around = (position: number) => (position + photos.length) % photos.length;

  const show = (next: number) => {
    setIndex(next);
    preloadViewerImage(photos[around(next + 1)]);
    preloadViewerImage(photos[around(next - 1)]);
  };

  const open = (next: number) => (event: MouseEvent<HTMLButtonElement>) => {
    setPlaceholders(Array.from(listRef.current?.querySelectorAll('img') ?? [], (image) => image.currentSrc));
    show(next);
    openModal(event.currentTarget);
  };

  const step = (delta: number) => show(around(index + delta));

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowLeft') {
      step(-1);
    } else if (event.key === 'ArrowRight') {
      step(1);
    }
  };

  if (!photo) {
    return null;
  }

  return (
    <>
      <ul
        ref={listRef}
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
              onPointerEnter={() => preloadViewerImage(shot)}
              onFocus={() => preloadViewerImage(shot)}
            >
              <span className={styles.shotImage}>
                <Image
                  src={shot.src}
                  alt={shotAlt(shot)}
                  sizes={itemSizes[position] ?? SHOT_SIZES}
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

      <Modal
        ref={modalRef}
        label={`${label}: просмотр фото`}
        wide
        onClose={restoreFocus}
        onKeyDown={onKeyDown}
      >
        <div className={styles.stage}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image не дает поправить дескрипторы srcSet */}
          <img
            key={photo.src}
            {...viewerImageProps(photo)}
            alt={photo.alt}
            className={styles.image}
            style={placeholder ? { backgroundImage: `url("${placeholder}")` } : undefined}
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
              onClick={closeModal}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};
