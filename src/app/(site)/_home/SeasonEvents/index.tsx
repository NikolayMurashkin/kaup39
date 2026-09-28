import Image from 'next/image';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Ornament } from '@/components/Ornament';
import { PhotoNote } from '@/components/PhotoNote';
import { Price } from '@/components/Price';
import { RunicText } from '@/components/RunicText';
import { Split } from '@/components/Split';
import { SCHEDULE_PATH } from '@/lib/consts';
import { paragraphs, plural, typograph } from '@/lib/format';
import { DATES_FORMS, EVENT_PHOTO_SIZES, KICKERS } from '../consts';
import type { EventCardDates, EventCardView } from '../types';
import styles from './SeasonEvents.module.scss';

export type SeasonEventsProps = {
  anchor: string;
  heading: string;
  /** Текст раздела из CMS: «поселение открыто только в дни событий». */
  body?: string | null;
  cards: EventCardView[];
};

const When = ({ dates }: { dates: EventCardDates }) => {
  if (dates.kind === 'dated') {
    return (
      <p
        className={styles.when}
        data-upcoming="event"
      >
        <span className={styles.caps}>ближайшая дата</span>
        <time
          className={styles.date}
          dateTime={dates.next.dateTime}
        >
          {dates.next.date}
        </time>
        <span className={styles.muted}>{dates.next.time}</span>
      </p>
    );
  }

  return (
    <p className={styles.when}>
      <span className={styles.caps}>дат пока нет</span>
      {dates.kind === 'closed' ? (
        <span className={styles.muted}>
          {dates.year ? `сезон ${dates.year} закрыт` : 'сезон закрыт'}
          {dates.last ? (
            <>
              {' '}
              <time dateTime={dates.last.dateTime}>{dates.last.date}</time>
            </>
          ) : null}
        </span>
      ) : (
        <span className={styles.muted}>новые даты появятся в&nbsp;расписании</span>
      )}
    </p>
  );
};

const Later = ({ dates }: { dates: EventCardDates }) => {
  if (dates.kind !== 'dated') return null;

  return (
    <p className={styles.later}>
      {dates.later ? (
        <>
          Еще {dates.later.count}&nbsp;{plural(dates.later.count, DATES_FORMS)} до&nbsp;
          <time dateTime={dates.later.dateTime}>{dates.later.date}</time>
        </>
      ) : (
        'Последняя дата в сезоне'
      )}
    </p>
  );
};

/**
 * События сезона по артборду v2: рейка с текстом раздела и ссылкой на расписание, карточка на каждое событие —
 * кадр, ближайшая дата, что входит, цена и касса этой даты. Вся карточка ведет на страницу события, касса — своей
 * кнопкой поверх. Сезон закрыт (D27) — карточки остаются без даты и кассы.
 */
export const SeasonEvents = ({ anchor, heading, body, cards }: SeasonEventsProps) => (
  <Split
    id={anchor}
    labelledBy={`${anchor}-title`}
    rail={
      <>
        <RunicText size="kicker">{KICKERS.events}</RunicText>
        <h2
          className={styles.title}
          id={`${anchor}-title`}
        >
          {typograph(heading)}
        </h2>
        {paragraphs(body).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <a
          className={styles.more}
          href={SCHEDULE_PATH}
        >
          Все даты и&nbsp;цены
          <Icon
            name="arrow"
            className={styles.moreIcon}
          />
        </a>
      </>
    }
  >
    <div className={styles.grid}>
      {cards.map((card) => (
        <article
          key={card.slug}
          className={styles.card}
          data-event-card={card.slug}
        >
          {card.photo ? (
            <div className={styles.media}>
              <Image
                className={styles.image}
                src={card.photo.src}
                alt={card.photo.alt}
                sizes={EVENT_PHOTO_SIZES}
                fill
              />
              {card.photo.temporary ? <PhotoNote /> : null}
              <Ornament className={styles.band} />
            </div>
          ) : null}

          <div className={styles.body}>
            <When dates={card.dates} />

            <h3 className={styles.name}>
              <a
                className={styles.stretched}
                href={card.href}
              >
                {typograph(card.title)}
              </a>
            </h3>

            {card.summary ? <p className={styles.text}>{typograph(card.summary)}</p> : null}

            {card.facts.length ? (
              <ul className={styles.facts}>
                {card.facts.map((fact) => (
                  <li key={fact}>{typograph(fact)}</li>
                ))}
              </ul>
            ) : null}

            <div className={styles.foot}>
              <Price
                className={styles.price}
                value={card.price.value}
                prefix={card.price.prefix}
                note={card.price.note}
              />
              {card.dates.kind === 'dated' ? (
                <Button
                  size="sm"
                  href={card.ticketUrl}
                  className={styles.buy}
                >
                  Купить билет
                </Button>
              ) : null}
            </div>

            <Later dates={card.dates} />
          </div>
        </article>
      ))}
    </div>
  </Split>
);
