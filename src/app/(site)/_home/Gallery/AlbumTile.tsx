'use client';

import { useState } from 'react';
import { flushSync } from 'react-dom';
import { IconButton } from '@/components/IconButton';
import { Modal } from '@/components/Modal';
import { useModal } from '@/components/Modal/useModal';
import { PhotoShot } from '@/components/PhotoViewer/PhotoShot';
import { PhotoSlider } from '@/components/PhotoSlider';
import { plural } from '@/lib/format';
import { SHOTS_FORMS } from '../consts';
import type { AlbumTile as AlbumTileView } from '../types';
import styles from './Gallery.module.scss';

export type AlbumTileProps = {
  tile: AlbumTileView;
  /** `sizes` обложки в клетке мозаики. */
  sizes: string;
};

/**
 * Плитка галереи: обложка — первый кадр альбома, на ней название и число кадров, без подписи автора. Плитка открывает
 * просмотр своего альбома: слайдер по правилу D31, кадры в порядке CMS, листание по кругу.
 */
export const AlbumTile = ({ tile, sizes }: AlbumTileProps) => {
  const { ref, open, close, restoreFocus } = useModal();
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [opened, setOpened] = useState(0);
  const { title, photos } = tile;
  const [cover] = photos;

  return (
    <>
      <PhotoShot
        photo={cover}
        sizes={sizes}
        captionText={title}
        caption={
          <>
            <span className={styles.tileTitle}>{title}</span>
            <span className={styles.tileCount}>
              {photos.length}&nbsp;{plural(photos.length, SHOTS_FORMS)}
            </span>
          </>
        }
        onOpen={(event) => {
          const image = event.currentTarget.querySelector('img');

          // Новый показ коммитится до showModal(): иначе фокус встает на кнопку старого слайдера, React ее пересоздает (новый key) и фокус падает на body вне окна.
          flushSync(() => {
            setPlaceholders(image?.currentSrc ? [image.currentSrc] : []);
            setOpened((times) => times + 1);
          });
          open(event.currentTarget);
        }}
      />

      <Modal
        ref={ref}
        label={`${title}: просмотр фото`}
        wide
        onClose={restoreFocus}
      >
        <PhotoSlider
          key={opened}
          label={title}
          photos={photos}
          placeholders={placeholders}
          fixedStage
        >
          <IconButton
            icon="close"
            label="Закрыть"
            className={styles.button}
            onClick={close}
          />
        </PhotoSlider>
      </Modal>
    </>
  );
};
