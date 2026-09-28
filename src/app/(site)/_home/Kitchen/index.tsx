import Image from 'next/image';
import type { Photo } from '@/cms/types';
import { PhotoNote } from '@/components/PhotoNote';
import { RunicText } from '@/components/RunicText';
import { paragraphs, typograph } from '@/lib/format';
import type { Tavern } from '@/payload-types';
import { KICKERS, KITCHEN_PHOTO_SIZES } from '../consts';
import styles from './Kitchen.module.scss';
import { TavernCard } from './TavernCard';

export type KitchenProps = {
  anchor: string;
  heading: string;
  body?: string | null;
  /** Кадр кухни — фотография текстового раздела `kitchen` в CMS. */
  photo: Photo | null;
  taverns: Tavern[];
};

/** Кухня по артборду v2: полоса во всю ширину — кадр и текст, под текстом таверны, каждая открывает диалог с меню. */
export const Kitchen = ({ anchor, heading, body, photo, taverns }: KitchenProps) => (
  <section
    className={styles.kitchen}
    id={anchor}
    aria-labelledby={`${anchor}-title`}
  >
    {photo ? (
      <div className={styles.photo}>
        <Image
          className={styles.image}
          src={photo.src}
          alt={photo.alt}
          sizes={KITCHEN_PHOTO_SIZES}
          fill
        />
        {photo.temporary ? <PhotoNote /> : null}
      </div>
    ) : null}

    <div className={styles.body}>
      <RunicText size="kicker">{KICKERS.kitchen}</RunicText>
      <h2
        className={styles.title}
        id={`${anchor}-title`}
      >
        {typograph(heading)}
      </h2>
      {paragraphs(body).map((paragraph) => (
        <p
          key={paragraph}
          className={styles.text}
        >
          {paragraph}
        </p>
      ))}

      <ul className={styles.taverns}>
        {taverns.map((tavern) => (
          <li key={tavern.id}>
            <TavernCard tavern={tavern} />
          </li>
        ))}
      </ul>
    </div>
  </section>
);
