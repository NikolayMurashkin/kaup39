import type { ReactNode } from 'react';
import type { ScheduleItem, TariffFact } from '@/cms/types';

/** Фильтры из адреса: `null` — «все». */
export type ScheduleFilters = {
  /** `YYYY-MM`. */
  month: string | null;
  /** slug события. */
  event: string | null;
};

/** Событие из расписания со всеми видами билета — для фильтра и таблицы цен. */
export type ScheduleEvent = {
  slug: string;
  title: string;
  tariffs: TariffFact[];
};

export type MonthGroup = {
  /** `YYYY-MM`. */
  month: string;
  rows: ScheduleItem[];
};

/** Вариант фильтра: «все» — с пустым значением. */
export type FilterOption = {
  value: string;
  label: ReactNode;
  href: string;
  current: boolean;
};
