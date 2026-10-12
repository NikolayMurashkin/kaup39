import type { ScheduleItem } from '@/cms/types';
import { Button } from '@/components/Button';
import { Price } from '@/components/Price';
import { cheapest, eventHref } from '@/lib/events';
import { formatDay, formatTime, formatWeekday, typograph } from '@/lib/format';
import styles from './ScheduleRow.module.scss';

export type ScheduleRowProps = {
  item: ScheduleItem;
};

/** Строка расписания: день тремя частями, событие со временем, цена от самого дешевого билета и касса этой даты. */
export const ScheduleRow = ({ item }: ScheduleRowProps) => {
  const price = cheapest(item);
  const [number, month] = formatDay(item.date).split(' ');

  return (
    <li
      className={styles.row}
      data-schedule-row
      data-event={item.event.slug}
    >
      <time
        className={styles.day}
        dateTime={item.date}
        data-row-part="date"
      >
        <b className={styles.number}>{number}</b>
        <span>{month}</span>
        <span>{formatWeekday(item.date)}</span>
      </time>

      <div className={styles.main}>
        <h3
          className={styles.name}
          data-row-part="event"
        >
          <a href={eventHref(item)}>{typograph(item.event.title)}</a>
        </h3>
        <p
          className={styles.time}
          data-row-part="time"
        >
          {formatTime(item)}
        </p>
      </div>

      <div className={styles.buy}>
        <div
          className={styles.price}
          data-row-part="price"
        >
          <Price
            value={price.value}
            prefix={price.prefix}
            note={price.note}
          />
        </div>

        <div
          className={styles.ticket}
          data-row-part="ticket"
        >
          <Button
            size="sm"
            href={item.event.ticketUrl}
          >
            Купить билет
          </Button>
        </div>
      </div>
    </li>
  );
};
