import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Photo, ZoneMark } from '@/cms/types';
import { typograph } from '@/lib/format';
import { Dialog } from '../Dialog';
import { Icon } from '../Icon';
import { Mark } from '../Mark';
import { PhotoNote } from '../PhotoNote';
import styles from './PlaceCard.module.scss';

export type PlaceCardProps = {
  name: string;
  /** Номер места в сетке: «02». */
  number?: number;
  /** Знак места — карточка без кадра рисует его крупно. */
  mark: ZoneMark;
  /** Кадр этого места (D31). Без него карточка — полноценный вариант со знаком, а не заглушка. */
  photo?: Photo | null;
  /** Строка действия внизу карточки: «Подробнее», «Меню». */
  action: string;
  /** Текст диалога, который открывает карточка. */
  children: ReactNode;
};

/**
 * Карточка-кнопка площадки по артборду v2: рамка латунью, внизу строка действия с плюсом, при наведении рамка
 * и значок охрой, кадр чуть приближается. С кадром карточка занимает две клетки на две, без кадра — одну.
 */
export const PlaceCard = ({ name, number, mark, photo, action, children }: PlaceCardProps) => (
  <Dialog
    label={name}
    triggerClassName={[styles.card, photo ? styles.withPhoto : null].filter(Boolean).join(' ')}
    heading={<p className={styles.dialogCaps}>{typograph(action)}</p>}
    trigger={
      <>
        {photo ? (
          <span className={styles.media}>
            <Image
              className={styles.image}
              src={photo.src}
              alt={photo.alt}
              sizes="(max-width: 640px) 100vw, 640px"
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
    {photo ? (
      <div className={styles.dialogMedia}>
        <Image
          className={styles.image}
          src={photo.src}
          alt={photo.alt}
          sizes="(max-width: 760px) 100vw, 760px"
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
