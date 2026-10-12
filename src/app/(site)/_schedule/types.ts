import type { ReactNode } from 'react';
import type { ScheduleItem, TariffFact } from '@/cms/types';
import type { DayLabel } from '../_home/types';

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
  /** Число строк с формой слова: «3 даты». */
  count: string;
};

/** Вариант фильтра: «все» — с пустым значением. */
export type FilterOption = {
  value: string;
  label: ReactNode;
  href: string;
  current: boolean;
};

/** Факты сезона над списком дат: год, число дат, последний день и число событий словами с числом. */
export type SeasonFacts = {
  year: number;
  dates: string;
  last: DayLabel;
  events: string;
};
