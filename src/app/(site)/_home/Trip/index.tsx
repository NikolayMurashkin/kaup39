import Image from 'next/image';
import { Icon } from '@/components/Icon';
import { PhotoNote } from '@/components/PhotoNote';
import { RunicText } from '@/components/RunicText';
import { Section } from '@/components/Section';
import { Split } from '@/components/Split';
import { paragraphs, typograph } from '@/lib/format';
import { KICKERS, TEASER_PHOTO_SIZES } from '../consts';
import type { TeaserView } from '../types';
import styles from './Trip.module.scss';

export type TripProps = {
  anchor: string;
  heading: string;
  body?: string | null;
  teasers: TeaserView[];
};

/**
 * «Спланируйте поездку» по артборду v2: вместо разделов проезда, кемпинга и аренды на главной — тизеры их страниц,
 * вся карточка — ссылка.
 */
export const Trip = ({ anchor, heading, body, teasers }: TripProps) => (
  <>
    <Split
      id={anchor}
      labelledBy={`${anchor}-title`}
      rail={
        <>
          <RunicText size="kicker">{KICKERS.trip}</RunicText>
          <h2
            className={styles.title}
            id={`${anchor}-title`}
          >
            {typograph(heading)}
          </h2>
        </>
      }
    >
      {paragraphs(body).map((paragraph) => (
        <p
          key={paragraph}
          className={styles.text}
        >
          {paragraph}
        </p>
      ))}
    </Split>

    <Section className={styles.row}>
      <ul className={styles.teasers}>
        {teasers.map((teaser) => (
          <li
            key={teaser.slug}
            className={styles[teaser.slug]}
          >
            <a
              className={[styles.teaser, teaser.photo ? null : styles.plain].filter(Boolean).join(' ')}
              href={teaser.href}
            >
              {teaser.photo ? (
                <span className={styles.media}>
                  <Image
                    className={styles.image}
                    src={teaser.photo.src}
                    alt={teaser.photo.alt}
                    sizes={TEASER_PHOTO_SIZES}
                    fill
                  />
                  {teaser.photo.temporary ? <PhotoNote /> : null}
                </span>
              ) : null}
              <span className={styles.body}>
                <span className={styles.label}>{teaser.label}</span>
                <span className={styles.teaserTitle}>{typograph(teaser.title)}</span>
                {teaser.text ? <span className={styles.teaserText}>{typograph(teaser.text)}</span> : null}
                <span className={styles.go}>
                  {typograph(teaser.action)}
                  <Icon
                    name="arrow"
                    className={styles.goIcon}
                  />
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  </>
);
