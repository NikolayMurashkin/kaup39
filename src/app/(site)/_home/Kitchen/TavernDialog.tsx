import Image from 'next/image';
import type { ReactNode } from 'react';
import { toPhoto } from '@/cms/photo';
import { Dialog } from '@/components/Dialog';
import { PhotoNote } from '@/components/PhotoNote';
import { Price } from '@/components/Price';
import { formatAmount, paragraphs, typograph } from '@/lib/format';
import type { Tavern } from '@/payload-types';
import { TAVERN_DIALOG_SIZES } from '../consts';
import styles from './Kitchen.module.scss';

export type TavernDialogProps = {
  tavern: Tavern;
  trigger: ReactNode;
  triggerClassName?: string;
  /** Имя кнопки для скринридера, когда ее текста мало: номер точки на карте. */
  triggerLabel?: string;
};

/**
 * Окно таверны: кадр, описание и меню с ценами из CMS. Его открывает строка таверны в кухне и точка карты поселения —
 * окно одно и то же, кнопка у каждого своя.
 */
export const TavernDialog = ({ tavern, trigger, triggerClassName, triggerLabel }: TavernDialogProps) => {
  const photo = toPhoto(tavern.photo);
  const menu = (tavern.menu ?? []).filter((part) => part.items?.length);

  return (
    <Dialog
      label={tavern.name}
      triggerClassName={triggerClassName}
      triggerLabel={triggerLabel}
      heading={<p className={styles.dialogCaps}>таверна · средневековая кухня</p>}
      trigger={trigger}
    >
      <h2 className={styles.dialogTitle}>{typograph(tavern.name)}</h2>

      {photo ? (
        <div className={styles.dialogMedia}>
          <Image
            className={styles.image}
            src={photo.src}
            alt={photo.alt}
            sizes={TAVERN_DIALOG_SIZES}
            fill
          />
          {photo.temporary ? <PhotoNote /> : null}
        </div>
      ) : null}

      {tavern.description ? (
        <div className={styles.dialogText}>
          {paragraphs(tavern.description).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {menu.map((part) => (
        <section
          key={part.id ?? part.title ?? 'menu'}
          className={styles.menuPart}
        >
          <h3 className={styles.menuTitle}>{typograph(part.title ?? 'Блюда')}</h3>
          {part.items?.map((item) => (
            <div
              key={item.id ?? item.name}
              className={styles.menuRow}
            >
              <p className={styles.dish}>{typograph(item.name)}</p>
              {item.note ? <p className={styles.dishNote}>{typograph(item.note)}</p> : null}
              <Price
                className={styles.dishPrice}
                value={
                  item.priceTo ? `${formatAmount(item.price)}–${formatAmount(item.priceTo)}` : formatAmount(item.price)
                }
              />
            </div>
          ))}
        </section>
      ))}
    </Dialog>
  );
};
