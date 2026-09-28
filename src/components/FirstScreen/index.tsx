import Image from 'next/image';
import type { Photo } from '@/cms/types';
import { formatAmount, phoneHref, typograph } from '@/lib/format';
import { HERO_QUALITY } from '@/lib/images';
import { Button } from '../Button';
import { Ornament } from '../Ornament';
import { PhotoNote } from '../PhotoNote';
import { Price } from '../Price';
import { RunicText } from '../RunicText';
import type { FirstScreenNext, FirstScreenSeasonClosed } from './types';
import styles from './FirstScreen.module.scss';

export type FirstScreenProps = {
  /** Кадр первого экрана своей темы, во весь экран и без вуали. */
  photo: Photo | null;
  title: string;
  lead?: string | null;
  /** Надпись рунами над заголовком. */
  runes?: string;
  /** Подпись кадра в углу: чей он. */
  credit?: string;
  /** Ближайшая дата, по которой можно купить билет; `null` — сезон закрыт (D27). */
  next: FirstScreenNext | null;
  seasonClosed?: FirstScreenSeasonClosed;
  scheduleHref: string;
  phone: string;
};

/**
 * Первый экран v2: кадр виден, плашка лежит только под текстом, в левом нижнем углу. До 1279 плашка компактнее —
 * без рун и лида, не шире 540 px: так кадр занимает не меньше половины экрана и на планшете, и в узком окне
 * ноутбука. Путь до билета — в плашке: «Купить билет» ведет в кассу ближайшей даты, «Все даты» — в расписание.
 */
export const FirstScreen = ({
  photo,
  title,
  lead,
  runes,
  credit,
  next,
  seasonClosed,
  scheduleHref,
  phone,
}: FirstScreenProps) => (
  <section
    className={styles.screen}
    aria-labelledby="first-screen-title"
  >
    {photo ? (
      <Image
        className={styles.photo}
        src={photo.src}
        alt={photo.alt}
        sizes="100vw"
        quality={HERO_QUALITY}
        preload
        fill
      />
    ) : null}

    {photo?.temporary ? (
      <PhotoNote className={styles.credit} />
    ) : credit ? (
      <p className={styles.credit}>{credit}</p>
    ) : null}

    <div className={styles.inner}>
      <div className={styles.plate}>
        <Ornament
          direction="vertical"
          className={styles.band}
        />

        {runes ? <RunicText className={styles.runes}>{runes}</RunicText> : null}

        <h1
          className={styles.title}
          id="first-screen-title"
        >
          {typograph(title)}
        </h1>

        {lead ? <p className={styles.lead}>{typograph(lead)}</p> : null}

        {next ? (
          <div className={styles.next}>
            <span className={styles.caps}>ближайшее</span>
            <time
              className={styles.date}
              dateTime={next.dateTime}
            >
              {next.date}
            </time>
            <span className={styles.details}>{typograph(next.details)}</span>
            <Price
              className={styles.price}
              value={formatAmount(next.price)}
            />
          </div>
        ) : seasonClosed ? (
          <div className={styles.next}>
            <span className={styles.caps}>{seasonClosed.label}</span>
            <span className={styles.details}>{typograph(seasonClosed.text)}</span>
          </div>
        ) : null}

        <div className={styles.actions}>
          {next ? (
            <>
              <Button href={next.ticketUrl}>Купить билет</Button>
              <Button
                kind="ghost"
                href={scheduleHref}
              >
                Все даты
              </Button>
            </>
          ) : (
            <>
              <Button
                kind="ghost"
                href={scheduleHref}
              >
                Расписание
              </Button>
              <Button
                kind="ghost"
                href={phoneHref(phone)}
              >
                Позвонить
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  </section>
);
