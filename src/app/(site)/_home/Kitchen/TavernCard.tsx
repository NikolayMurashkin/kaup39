import Image from 'next/image';
import { toPhoto } from '@/cms/photo';
import { Dialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { PhotoNote } from '@/components/PhotoNote';
import { Price } from '@/components/Price';
import { formatAmount, paragraphs, typograph } from '@/lib/format';
import type { Tavern } from '@/payload-types';
import { tavernSummary } from '../cards';
import { TAVERN_DIALOG_SIZES, TAVERN_THUMB_SIZES } from '../consts';
import styles from './Kitchen.module.scss';

export type TavernCardProps = {
  tavern: Tavern;
};

/**
 * Строка таверны на главной — кнопка; диалог показывает кадр, описание и меню с ценами из CMS. Миниатюра в кнопке
 * декоративная: описание кадра стоит у него в диалоге, а в имени кнопки было бы лишним.
 */
export const TavernCard = ({ tavern }: TavernCardProps) => {
  const photo = toPhoto(tavern.photo);
  const summary = tavernSummary(tavern);
  const menu = (tavern.menu ?? []).filter((part) => part.items?.length);

  return (
    <Dialog
      label={tavern.name}
      triggerClassName={[styles.tavern, photo ? styles.withPhoto : null].filter(Boolean).join(' ')}
      heading={<p className={styles.dialogCaps}>таверна · средневековая кухня</p>}
      trigger={
        <>
          {photo ? (
            <span className={styles.thumb}>
              <Image
                className={styles.image}
                src={photo.src}
                alt=""
                sizes={TAVERN_THUMB_SIZES}
                fill
              />
            </span>
          ) : null}
          <span className={styles.name}>{typograph(tavern.name)}</span>
          {summary ? <span className={styles.meta}>{summary}</span> : null}
          <span className={styles.go}>
            {menu.length ? 'Меню' : 'Подробнее'}
            <Icon
              name="arrow"
              className={styles.goIcon}
            />
          </span>
        </>
      }
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
