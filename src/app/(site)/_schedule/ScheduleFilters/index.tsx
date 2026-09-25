import { formatMonth, typograph } from '@/lib/format';
import { filterHref } from '../rows';
import type { FilterOption, ScheduleEvent, ScheduleFilters as Filters } from '../types';
import styles from './ScheduleFilters.module.scss';

export type ScheduleFiltersProps = {
  months: string[];
  events: ScheduleEvent[];
  filters: Filters;
};

type FilterGroupProps = {
  name: keyof Filters;
  label: string;
  options: FilterOption[];
};

const FilterGroup = ({ name, label, options }: FilterGroupProps) => (
  <div
    className={styles.group}
    role="group"
    aria-labelledby={`filter-${name}`}
    data-filter={name}
  >
    <p
      id={`filter-${name}`}
      className={styles.caps}
    >
      {label}
    </p>

    <ul className={styles.options}>
      {options.map((option) => (
        <li key={option.value}>
          <a
            className={option.current ? `${styles.option} ${styles.current}` : styles.option}
            href={option.href}
            data-value={option.value}
            aria-current={option.current ? 'true' : undefined}
          >
            {option.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

/** Фильтры по месяцу и событию — ссылками: страница собирается на сервере, и фильтр работает без скриптов. */
export const ScheduleFilters = ({ months, events, filters }: ScheduleFiltersProps) => (
  <nav
    className={styles.filters}
    aria-label="Фильтр расписания"
  >
    <FilterGroup
      name="month"
      label="Месяц"
      options={[
        { value: '', label: 'Все', href: filterHref({ ...filters, month: null }), current: !filters.month },
        ...months.map((month) => ({
          value: month,
          label: <time dateTime={month}>{formatMonth(month)}</time>,
          href: filterHref({ ...filters, month }),
          current: filters.month === month,
        })),
      ]}
    />

    <FilterGroup
      name="event"
      label="Событие"
      options={[
        { value: '', label: 'Все', href: filterHref({ ...filters, event: null }), current: !filters.event },
        ...events.map((event) => ({
          value: event.slug,
          label: typograph(event.title),
          href: filterHref({ ...filters, event: event.slug }),
          current: filters.event === event.slug,
        })),
      ]}
    />
  </nav>
);
