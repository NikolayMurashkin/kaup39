import type { Page, Site, Tavern, Zone } from '@/payload-types';

/** Знак площадки из спрайта направления. */
export type ZoneMark = 'house' | 'forge' | 'pot' | 'bow' | 'shield' | 'ship' | 'hall' | 'horn';

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

/** Данные главной: страница из CMS, соседние разделы и даты, которые еще не прошли. */
export type HomeData = {
  site: Site;
  page: Page | null;
  /** Страница «как доехать»: главная берет из нее плашку трансфера. */
  directions: Page | null;
  zones: Zone[];
  taverns: Tavern[];
  upcoming: ScheduleItem[];
};

/** Данные страницы расписания: контакты и все даты — какие из них показывать, решает страница. */
export type SchedulePageData = {
  site: Site;
  schedule: ScheduleItem[];
};

/** Данные страницы «как доехать»: ее разделы из CMS и контакты с точкой на карте. */
export type DirectionsPageData = {
  site: Site;
  page: Page | null;
};

/** Раздел страницы из CMS — один блок из `sections`. */
export type PageSection = NonNullable<Page['sections']>[number];

/** Фотография из медиатеки: адрес файла в Payload, описание для `alt` и подпись. */
export type Photo = {
  src: string;
  alt: string;
  caption: string | null;
};
