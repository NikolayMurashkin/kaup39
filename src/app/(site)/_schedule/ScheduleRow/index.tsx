import type { ScheduleItem } from '@/cms/types';
import { Button } from '@/components/Button';
import { Price } from '@/components/Price';
import { cheapest, eventHref } from '@/lib/events';
import { formatDate, formatTime, typograph } from '@/lib/format';
import styles from './ScheduleRow.module.scss';

export type ScheduleRowProps = {
  item: ScheduleItem;
};

/** Строка расписания: дата и время, событие, цена от самого дешевого билета и кнопка кассы этой даты. */
export const ScheduleRow = ({ item }: ScheduleRowProps) => {
  const price = cheapest(item);

  return (
    <li
      className={styles.row}
      data-schedule-row
      data-event={item.event.slug}
    >
      <p className={styles.when}>
        <time
          className={styles.date}
          dateTime={item.date}
          data-row-part="date"
        >
          {formatDate(item.date)}
        </time>
        <span
          className={styles.time}
          data-row-part="time"
        >
          {formatTime(item)}
        </span>
      </p>

      <h3
        className={styles.name}
        data-row-part="event"
      >
        <a href={eventHref(item)}>{typograph(item.event.title)}</a>
      </h3>

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
    </li>
  );
};
