import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import type { HeroVideoSources, Photo } from '@/cms/types';
import { formatAmount, nowrap, phoneHref, typograph } from '@/lib/format';
import { fitSrcSet, HERO_QUALITY } from '@/lib/images';
import { THEMES } from '@/lib/consts';
import type { Theme } from '@/lib/types';
import { Button } from '../Button';
import { Ornament } from '../Ornament';
import { PhotoNote } from '../PhotoNote';
import { Price } from '../Price';
import { RunicText } from '../RunicText';
import { HERO_NARROW_HEIGHTS, HERO_NARROW_MEDIA, HERO_THEME_ATTR, HERO_WIDE_MEDIA, NEXT_LABEL } from './consts';
import type {
  FirstScreenAction,
  FirstScreenFacts,
  FirstScreenNext,
  FirstScreenSeasonClosed,
  FirstScreenSize,
  HeroImageProps,
} from './types';
import { HeroVideo } from './HeroVideo';
import { heroPoster, wideHeroImage } from './video';
import styles from './FirstScreen.module.scss';

type HeroPhotoProps = {
  photo: Photo;
  theme: Theme;
  /** Кадр текущей темы; кадр второй темы спрятан по `data-theme` и не грузится, пока его не покажут. */
  active: boolean;
  size: FirstScreenSize;
};

/**
 * `sizes` узкого источника. В портретном окне плашка выше ширины окна, и `object-fit: cover` рисует кадр шириной
 * «высота плашки × пропорция кадра» — в два-три раза шире окна: со `100vw` браузер брал файл под ширину окна
 * и растягивал его. В альбомном окне кадр по ширине окна. Размера файла нет — ширина окна.
 */
const narrowSizes = ({ width, height }: Photo, size: FirstScreenSize) =>
  width && height
    ? `(orientation: landscape) 100vw, max(100vw, ${HERO_NARROW_HEIGHTS[size]} * ${(width / height).toFixed(4)})`
    : '100vw';

/**
 * Кадр первого экрана — LCP: на телефоне легкий (качество 40), шире 640 px — источник с качеством для широкого экрана,
 * иначе растянутый на всю ширину кадр расплывается. Каждый источник предзагружается только на своей ширине.
 * Кандидаты узкого источника не шире файла (`fitSrcSet`): оптимизатор файл не увеличивает.
 */
const HeroPhoto = ({ photo, theme, active, size }: HeroPhotoProps) => {
  const wide = wideHeroImage(photo);
  const { props: fitted } = getImageProps({
    src: photo.src,
    alt: photo.alt,
    fill: true,
    sizes: narrowSizes(photo, size),
    quality: HERO_QUALITY,
  });
  const narrow = photo.width && fitted.srcSet ? { ...fitted, srcSet: fitSrcSet(fitted.srcSet, photo.width) } : fitted;

  if (active) {
    preloadHero(narrow, wide);
  }

  return (
    <picture
      className={styles.picture}
      {...{ [HERO_THEME_ATTR]: theme }}
    >
      <source
        media={HERO_NARROW_MEDIA}
        srcSet={narrow.srcSet}
        sizes={narrow.sizes}
      />
      <img
        {...wide}
        alt={photo.alt}
        className={styles.photo}
        fetchPriority={active ? 'high' : undefined}
        loading={active ? 'eager' : 'lazy'}
      />
    </picture>
  );
};

const preloadHero = (narrow: HeroImageProps, wide: HeroImageProps) => {
  preload(narrow.src, {
    as: 'image',
    imageSrcSet: narrow.srcSet,
    imageSizes: narrow.sizes,
    media: HERO_NARROW_MEDIA,
    fetchPriority: 'high',
  });
  preload(wide.src, {
    as: 'image',
    imageSrcSet: wide.srcSet,
    imageSizes: wide.sizes,
    media: HERO_WIDE_MEDIA,
    fetchPriority: 'high',
  });
};

export type FirstScreenProps = {
  /** Кадры первого экрана обеих тем, во весь экран и без вуали: вечерний и дневной. */
  photos: Record<Theme, Photo | null>;
  theme: Theme;
  title: string;
  lead?: string | null;
  /** Надпись рунами над заголовком. */
  runes?: string;
  /** Строка капителью над заголовком вместо рун: «событие · 6+». */
  kind?: string;
  /** Подпись ближайшей даты. */
  nextLabel?: string;
  size?: FirstScreenSize;
  /** Подпись кадра в углу: чей он. */
  credit?: string;
  /** Ближайшая дата, по которой можно купить билет; `null` — сезон закрыт (D27). */
  next: FirstScreenNext | null;
  seasonClosed?: FirstScreenSeasonClosed;
  /** Факты страницы без расписания: стоят на месте ближайшей даты, когда ее нет. */
  facts?: FirstScreenFacts;
  /** Свои кнопки плашки вместо пары по умолчанию. */
  actions?: FirstScreenAction[];
  scheduleHref: string;
  phone: string;
  /**
   * Петля поверх кадра из медиатеки: только с кадром текущей темы — он постер и LCP, видео включается в браузере
   * после загрузки страницы. Нет — первый экран остается кадром.
   */
  video?: HeroVideoSources | null;
};

/**
 * Первый экран v2: кадр виден, плашка лежит только под текстом, в левом нижнем углу. До 1279 плашка компактнее —
 * без рун и лида, не шире 540 px: так кадр занимает не меньше половины экрана и на планшете, и в узком окне
 * ноутбука. Путь до билета — в плашке: «Купить билет» ведет в кассу ближайшей даты, «Все даты» — в расписание.
 */
export const FirstScreen = ({
  photos,
  theme,
  title,
  lead,
  runes,
  kind,
  nextLabel = NEXT_LABEL,
  size = 'screen',
  credit,
  next,
  seasonClosed,
  facts,
  actions,
  scheduleHref,
  phone,
  video,
}: FirstScreenProps) => {
  const photo = photos[theme];
  const bare = THEMES.every((photoTheme) => !photos[photoTheme]);
  const withVideo = Boolean(video && photo);

  return (
    <section
      className={[
        styles.screen,
        size === 'page' ? styles.page : null,
        bare ? styles.bare : null,
        withVideo ? styles.withVideo : null,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby="first-screen-title"
      data-first-screen
    >
      {THEMES.map((photoTheme) => {
        const themePhoto = photos[photoTheme];

        return themePhoto ? (
          <HeroPhoto
            key={photoTheme}
            photo={themePhoto}
            theme={photoTheme}
            active={photoTheme === theme}
            size={size}
          />
        ) : null;
      })}

      {video && photo ? (
        <HeroVideo
          video={video}
          poster={heroPoster(photo)}
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
          {kind ? <p className={`${styles.caps} ${styles.kind}`}>{typograph(kind)}</p> : null}

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
              <span className={styles.caps}>{nextLabel}</span>
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
                prefix={next.pricePrefix}
              />
            </div>
          ) : facts ? (
            <div className={styles.next}>
              <span className={styles.caps}>{typograph(facts.label)}</span>
              {facts.value ? <span className={`${styles.date} ${styles.value}`}>{typograph(facts.value)}</span> : null}
              {facts.details.map((detail, index) => (
                <span
                  key={`${index}-${detail}`}
                  className={styles.details}
                >
                  {typograph(detail)}
                </span>
              ))}
              {facts.price ? (
                <div className={styles.fact}>
                  <Price
                    className={styles.price}
                    value={facts.price.value}
                  />
                  {facts.price.note ? <span className={styles.details}>{typograph(facts.price.note)}</span> : null}
                </div>
              ) : null}
            </div>
          ) : seasonClosed ? (
            <div className={styles.next}>
              <span className={styles.caps}>{seasonClosed.label}</span>
              <span className={styles.details}>
                {seasonClosed.last ? (
                  <>
                    Последнее событие прошло{' '}
                    <time dateTime={seasonClosed.last.dateTime}>{nowrap(seasonClosed.last.date)}</time>.{' '}
                  </>
                ) : null}
                Новые даты появятся в&nbsp;расписании.
              </span>
            </div>
          ) : null}

          <div className={styles.actions}>
            {actions ? (
              actions.map(({ label, href }) => (
                <Button
                  key={href}
                  kind="ghost"
                  href={href}
                >
                  {label}
                </Button>
              ))
            ) : next ? (
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
};
