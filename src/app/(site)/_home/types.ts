import type { Photo } from '@/cms/types';
import type { Page } from '@/payload-types';

/** День для `<time>`: `dateTime` — `YYYY-MM-DD`, `date` — словами. */
export type DayLabel = { dateTime: string; date: string };

/**
 * Даты карточки события: ближайшая и сколько еще до последней; у события нет будущих дат, а у других есть —
 * `waiting`; будущих дат нет ни у кого — сезон закрыт (D27), с годом и днем последнего события.
 */
export type EventCardDates =
  | { kind: 'dated'; next: DayLabel & { time: string }; later: (DayLabel & { count: number }) | null }
  | { kind: 'waiting' }
  | { kind: 'closed'; year: number | null; last: DayLabel | null };

export type EventCardView = {
  slug: string;
  href: string;
  title: string;
  summary: string | null;
  /** Что входит в билет — первые пункты. */
  facts: string[];
  photo: Photo | null;
  ticketUrl: string;
  price: { value: string; prefix?: string; note: string };
  dates: EventCardDates;
};

/** Страница, которая на главной стоит тизером, и куда он ведет. */
export type TeaserPage = { slug: Page['slug']; href: string; label: string };

export type TeaserView = TeaserPage & {
  title: string;
  text: string | null;
  action: string;
  photo: Photo | null;
};

/** Клетка мозаики галереи: большая 2×2, высокая 1×2, широкая 2×1, во всю строку или обычная. */
export type MosaicSize = 'big' | 'tall' | 'wide' | 'full' | '';

/** Ориентация кадра: `portrait` — выше, чем шире. */
export type Orientation = 'portrait' | 'landscape';

/** Полоса мозаики: клетки по порядку с ориентацией кадра для каждой и цена обрезки (0 — кадры в клетках своей формы). */
export type MosaicBand = {
  cells: [MosaicSize, Orientation][];
  cost: number;
};

/** Клетка мозаики с кадром. */
export type MosaicCell = {
  photo: Photo;
  size: MosaicSize;
};
