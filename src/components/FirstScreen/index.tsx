import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import type { Photo } from '@/cms/types';
import { formatAmount, phoneHref, typograph } from '@/lib/format';
import { HERO_QUALITY, HERO_WIDE_QUALITY } from '@/lib/images';
import { Button } from '../Button';
import { Ornament } from '../Ornament';
import { PhotoNote } from '../PhotoNote';
import { Price } from '../Price';
import { RunicText } from '../RunicText';
import { HERO_NARROW_MEDIA, HERO_SIZES, HERO_WIDE_MEDIA } from './consts';
import type { FirstScreenNext, FirstScreenSeasonClosed } from './types';
import styles from './FirstScreen.module.scss';

type HeroPhotoProps = {
  photo: Photo;
};

/**
 * Кадр первого экрана — LCP: на телефоне легкий (качество 40), шире 640 px — источник с качеством для широкого экрана,
 * иначе растянутый на всю ширину кадр расплывается. Каждый источник предзагружается только на своей ширине.
 */
const HeroPhoto = ({ photo }: HeroPhotoProps) => {
  const common = { src: photo.src, alt: photo.alt, sizes: HERO_SIZES, fill: true };
  const { props: wide } = getImageProps({ ...common, quality: HERO_WIDE_QUALITY });
  const { props: narrow } = getImageProps({ ...common, quality: HERO_QUALITY });

  preload(narrow.src, {
    as: 'image',
    imageSrcSet: narrow.srcSet,
    imageSizes: HERO_SIZES,
    media: HERO_NARROW_MEDIA,
    fetchPriority: 'high',
  });
  preload(wide.src, {
    as: 'image',
    imageSrcSet: wide.srcSet,
    imageSizes: HERO_SIZES,
    media: HERO_WIDE_MEDIA,
    fetchPriority: 'high',
  });

  return (
    <picture>
      <source
        media={HERO_NARROW_MEDIA}
        srcSet={narrow.srcSet}
        sizes={HERO_SIZES}
      />
      <img
        {...wide}
        alt={photo.alt}
        className={styles.photo}
        fetchPriority="high"
        loading="eager"
      />
    </picture>
  );
};

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
    data-first-screen
  >
    {photo ? <HeroPhoto photo={photo} /> : null}

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
          <div
            className={styles.next}
            data-upcoming="next"
          >
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
            <span className={styles.details}>
              {seasonClosed.last ? (
                <>
                  Последнее событие прошло <time dateTime={seasonClosed.last.dateTime}>{seasonClosed.last.date}</time>
                  .{' '}
                </>
              ) : null}
              Новые даты появятся в&nbsp;расписании.
            </span>
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
