import type { ScheduleItem } from '@/cms/types';
import { cheapest, eventHref } from '@/lib/events';
import { formatDay, paragraphs, typograph } from '@/lib/format';
import styles from './UpcomingDates.module.scss';

export type UpcomingDatesProps = {
  /** Даты, которые еще не прошли, от ближайшей. Пустой список сюда не приходит: блока тогда нет. */
  items: ScheduleItem[];
  anchor: string;
  heading?: string | null;
  note?: string | null;
};

/** Лента ближайших дат под первым экраном: день, событие и цена от, каждая ведет на страницу события. */
export const UpcomingDates = ({ items, anchor, heading, note }: UpcomingDatesProps) => (
  <section
    id={anchor}
    className={styles.upcoming}
    data-upcoming="dates"
  >
    <div className={styles.dates}>
      <h2 className={styles.caps}>{heading ? typograph(heading) : 'Ближайшие даты'}</h2>

      {items.map((item, index) => {
        const price = cheapest(item);

        return (
          <a
            key={item.id}
            className={index === 0 ? `${styles.chip} ${styles.first}` : styles.chip}
            href={eventHref(item)}
          >
            <time
              className={styles.day}
              dateTime={item.date}
            >
              {formatDay(item.date)}
            </time>
            <span className={styles.name}> · {typograph(item.event.title)} · </span>
            <span className={styles.price}>
              {price.prefix ? `${price.prefix} ` : ''}
              {price.value}
              {' '}
              <span className={styles.rub}>₽</span>
            </span>
          </a>
        );
      })}
    </div>

    {paragraphs(note).map((paragraph) => (
      <p
        key={paragraph}
        className={styles.note}
      >
        {paragraph}
      </p>
    ))}
  </section>
);
