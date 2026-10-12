import { formatMonth } from '@/lib/format';
import { ScheduleRow } from '../ScheduleRow';
import type { MonthGroup } from '../types';
import styles from './ScheduleMonth.module.scss';

export type ScheduleMonthProps = {
  group: MonthGroup;
};

/** Даты одного месяца. Заголовок месяца стоит в `<time>`: он сдвигается вместе с датами. */
export const ScheduleMonth = ({ group }: ScheduleMonthProps) => (
  <section
    className={styles.month}
    data-schedule-month={group.month}
    aria-labelledby={`month-${group.month}`}
  >
    <div className={styles.head}>
      <h2
        className={styles.title}
        id={`month-${group.month}`}
      >
        <time dateTime={group.month}>{formatMonth(group.month)}</time>
      </h2>
      <span className={styles.count}>{group.count}</span>
    </div>

    <ol className={styles.rows}>
      {group.rows.map((item) => (
        <ScheduleRow
          key={item.id}
          item={item}
        />
      ))}
    </ol>
  </section>
);
