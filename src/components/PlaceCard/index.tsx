import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Photo, ZoneMark } from '@/cms/types';
import { typograph } from '@/lib/format';
import { Icon } from '../Icon';
import { Mark } from '../Mark';
import { PhotoNote } from '../PhotoNote';
import { CARD_SIZES } from './consts';
import styles from './PlaceCard.module.scss';
import { PlaceDialog } from './PlaceDialog';

export type PlaceCardProps = {
  name: string;
  /** Номер места в сетке: «02». */
  number?: number;
  /** Знак места — карточка без кадра рисует его крупно. */
  mark: ZoneMark;
  /** Кадр этого места (D31). Без него карточка — полноценный вариант со знаком, а не заглушка. */
  photo?: Photo | null;
  /** Кадры этого места для слайдера в диалоге; пусто — в диалоге кадр карточки или знак. */
  gallery?: Photo[];
  /** Строка действия внизу карточки: «Подробнее», «Меню». */
  action: string;
  /** Текст диалога, который открывает карточка. */
  children: ReactNode;
};

/**
 * Карточка-кнопка площадки по артборду v2: рамка латунью, внизу строка действия с плюсом, при наведении рамка
 * и значок охрой, кадр чуть приближается. С кадром карточка занимает две клетки на две, без кадра — одну.
 */
export const PlaceCard = ({ name, number, mark, photo, gallery = [], action, children }: PlaceCardProps) => (
  <PlaceDialog
    name={name}
    mark={mark}
    photo={photo}
    gallery={gallery}
    action={action}
    triggerClassName={[styles.card, photo ? styles.withPhoto : null].filter(Boolean).join(' ')}
    trigger={
      <>
        {photo ? (
          <span className={styles.media}>
            <Image
              className={styles.image}
              src={photo.src}
              alt={photo.alt}
              sizes={CARD_SIZES}
              fill
            />
            {photo.temporary ? <PhotoNote /> : null}
          </span>
        ) : (
          <span className={styles.top}>
            <Mark
              mark={mark}
              className={styles.mark}
            />
            {number ? <span className={styles.number}>{String(number).padStart(2, '0')}</span> : null}
          </span>
        )}

        <span className={styles.body}>
          <span className={styles.name}>{typograph(name)}</span>
          <span className={styles.go}>
            {action}
            <Icon
              name="plus"
              className={styles.plus}
            />
          </span>
        </span>
      </>
    }
  >
    {children}
  </PlaceDialog>
);
