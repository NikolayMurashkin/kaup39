'use client';

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Photo } from '@/cms/types';
import { IconButton } from '../IconButton';
import { Modal } from '../Modal';
import { useModal } from '../Modal/useModal';
import { PhotoSlider } from '../PhotoSlider';
import { PhotoShot } from './PhotoShot';
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
 * Галерея с просмотром: кадр-кнопка открывает нативный `<dialog>` со слайдером (`PhotoSlider`): кадр целиком
 * без обрезки и не больше собственного размера, подпись и счетчик «3 из 6»; кнопки и стрелки клавиатуры листают
 * по кругу, Esc закрывает, фокус возвращается на кадр.
 */
export const PhotoViewer = ({ label, photos, className, itemClassNames = [], itemSizes = [] }: PhotoViewerProps) => {
  const { ref: modalRef, open: openModal, close: closeModal, restoreFocus } = useModal();
  const [opened, setOpened] = useState({ at: 0, times: 0 });
  /** Файлы кадров галереи, которые браузер уже скачал: подложка кадра просмотра, пока грузится полный. */
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  if (!photos.length) {
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
            <PhotoShot
              photo={shot}
              sizes={itemSizes[position]}
              caption={shot.caption ?? shot.alt}
              captionText={shot.caption}
              onOpen={(event) => {
                // Новый показ коммитится до showModal(): иначе фокус встает на кнопку старого слайдера, React ее пересоздает (новый key) и фокус падает на body вне окна.
                flushSync(() => {
                  setPlaceholders(
                    Array.from(listRef.current?.querySelectorAll('img') ?? [], (image) => image.currentSrc),
                  );
                  setOpened(({ times }) => ({ at: position, times: times + 1 }));
                });
                openModal(event.currentTarget);
              }}
            />
          </li>
        ))}
      </ul>

      <Modal
        ref={modalRef}
        label={`${label}: просмотр фото`}
        wide
        onClose={restoreFocus}
      >
        <PhotoSlider
          key={opened.times}
          label={label}
          photos={photos}
          initialIndex={opened.at}
          placeholders={placeholders}
          fixedStage
        >
          <IconButton
            icon="close"
            label="Закрыть"
            className={styles.button}
            onClick={closeModal}
          />
        </PhotoSlider>
      </Modal>
    </>
  );
};
