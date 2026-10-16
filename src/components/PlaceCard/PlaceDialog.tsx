import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Photo, ZoneMark } from '@/cms/types';
import { typograph } from '@/lib/format';
import { Dialog } from '../Dialog';
import { Mark } from '../Mark';
import { PhotoNote } from '../PhotoNote';
import { PhotoSlider } from '../PhotoSlider';
import { CARD_DIALOG_SIZES, DIALOG_WIDTH } from './consts';
import styles from './PlaceCard.module.scss';

export type PlaceDialogProps = {
  name: string;
  /** Знак места — окно без кадра рисует его крупно. */
  mark: ZoneMark;
  photo?: Photo | null;
  /** Кадры места для слайдера; пусто — кадр `photo` или знак. */
  gallery?: Photo[];
  /** Подпись в шапке окна: «Подробнее». */
  action: string;
  /** Содержимое кнопки, которая открывает окно. */
  trigger: ReactNode;
  triggerClassName?: string;
  /** Имя кнопки для скринридера, когда ее текста мало: номер точки на карте. */
  triggerLabel?: string;
  /** Текст окна под названием. */
  children: ReactNode;
};

/**
 * Окно места: слайдер кадров, кадр или знак, название и текст. Его открывает карточка площадки и точка карты поселения
 * — окно одно и то же, кнопка у каждого своя.
 */
export const PlaceDialog = ({
  name,
  mark,
  photo,
  gallery = [],
  action,
  trigger,
  triggerClassName,
  triggerLabel,
  children,
}: PlaceDialogProps) => (
  <Dialog
    label={name}
    triggerClassName={triggerClassName}
    triggerLabel={triggerLabel}
    heading={<p className={styles.dialogCaps}>{typograph(action)}</p>}
    trigger={trigger}
  >
    {gallery.length ? (
      <PhotoSlider
        label={`${name}: фото`}
        photos={gallery}
        windowWidth={DIALOG_WIDTH}
        hiddenCaption={name}
        compact
      />
    ) : photo ? (
      <div className={styles.dialogMedia}>
        <Image
          className={styles.image}
          src={photo.src}
          alt={photo.alt}
          sizes={CARD_DIALOG_SIZES}
          fill
        />
        {photo.temporary ? <PhotoNote /> : null}
      </div>
    ) : (
      <div className={styles.dialogMark}>
        <Mark
          mark={mark}
          className={styles.dialogMarkIcon}
        />
      </div>
    )}

    <h2 className={styles.dialogTitle}>{typograph(name)}</h2>
    <div className={styles.dialogText}>{children}</div>
  </Dialog>
);
