/** Вид билета: входной у дневных событий, остальные — у событий с вечерним шоу. */
export type TariffKind = 'entry' | 'adult' | 'child' | 'family22' | 'family21';

export type TariffFact = {
  kind: TariffKind;
  /** Цена в рублях. */
  amount: number;
};

/** Факты события, которые лежат в git: без названий и текстов владельцев, они приезжают из файла контента. */
export type EventFact = {
  slug: string;
  ticketUrl: string;
  tariffs: TariffFact[];
};

/** Дата события в расписании. Время — по Калининграду, `HH:MM`. */
export type ScheduleFact = {
  /** slug события. */
  event: string;
  /** `YYYY-MM-DD`. */
  date: string;
  start: string;
  end: string;
  /** Начало огненного шоу, если оно есть. */
  show?: string;
};

/** Дата расписания в том виде, в каком ее получают страницы: день по Калининграду и цены события. */
export type ScheduleItem = {
  id: number;
  /** `YYYY-MM-DD`. */
  date: string;
  start: string;
  end: string;
  show: string | null;
  event: { slug: string; title: string; ticketUrl: string };
  tariffs: TariffFact[];
};
