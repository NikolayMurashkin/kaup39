import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import type { Photo, ScheduleItem } from '@/cms/types';
import { Button } from '@/components/Button';
import { RunicText } from '@/components/RunicText';
import { runicPath } from '@/components/RunicText/path';
import { StonePanel } from '@/components/StonePanel';
import { SCHEDULE_PATH } from '@/lib/consts';
import { HERO_QUALITY } from '@/lib/images';
import { typograph } from '@/lib/format';
import { toPanelEvent } from '../events';
import { HERO_SIZES } from './consts';
import styles from './Hero.module.scss';

export type HeroProps = {
  title: string;
  lead?: string | null;
  /** Кадр своей темы: вечерний для темной, дневной для светлой. */
  photo: Photo | null;
  /** Чье фото — подпись на кадре. */
  credit: string;
  /** Ближайшая дата, которая еще не прошла; нет дат — нет и панели. */
  next: ScheduleItem | null;
};

/**
 * Первый экран. Заголовок читается капителью, а руны под ним — его же слова, набранные алфавитом
 * направления: каждое слово отдельной надписью, чтобы строка переносилась по словам. Ссылка на расписание
 * стоит под подзаголовком, а не только в панели: на узкой ширине панель уходит ниже первого экрана,
 * а при пустом расписании ее нет совсем.
 */
const HeroImage = ({ src }: { src: string }) => {
  const { props } = getImageProps({
    className: styles.image,
    src,
    alt: '',
    sizes: HERO_SIZES,
    quality: HERO_QUALITY,
    fill: true,
    preload: true,
  });

  preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: 'high' });

  return <img {...props} />;
};

export const Hero = ({ title, lead, photo, credit, next }: HeroProps) => {
  const words = title.split(/\s+/).filter((word) => runicPath(word).width > 0);

  return (
    <section
      className={styles.hero}
      data-first-screen
    >
      {photo ? (
        <>
          <div className={styles.photo}>
            <HeroImage src={photo.src} />
          </div>
          <div className={styles.scrim} />
          <p className={styles.credit}>фото: {typograph(credit)}</p>
        </>
      ) : null}

      <div className={styles.body}>
        <div className={styles.intro}>
          <h1 className={styles.title}>
            <span className={styles.eyebrow}>{typograph(title)}</span>
            <span className={styles.runes}>
              {words.map((word, index) => (
                <RunicText
                  key={`${word}-${index}`}
                  size="hero"
                  className={index === words.length - 1 ? styles.accent : undefined}
                >
                  {word}
                </RunicText>
              ))}
            </span>
          </h1>

          {lead ? <p className={styles.lead}>{typograph(lead)}</p> : null}

          <div className={styles.actions}>
            <Button
              kind="ghost"
              href={SCHEDULE_PATH}
            >
              Расписание и&nbsp;цены
            </Button>
          </div>
        </div>

        {next ? (
          <div
            className={styles.panel}
            data-upcoming="next"
          >
            <StonePanel event={toPanelEvent(next)} />
          </div>
        ) : null}
      </div>
    </section>
  );
};
