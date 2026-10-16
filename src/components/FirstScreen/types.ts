import type { getImageProps } from 'next/image';

/** Ближайшая дата в плашке первого экрана: день, подробности, цена и касса этой даты. */
export type FirstScreenNext = {
  /** День для `<time dateTime>`: `YYYY-MM-DD`. */
  dateTime: string;
  /** День словами: «3 октября». */
  date: string;
  /** День недели, время и событие: «суббота, 13:00 — 16:00 · День с викингами». */
  details: string;
  /** Цена самого дешевого билета, рубли. */
  price: number;
  /** «от» перед ценой, когда видов билета несколько. */
  pricePrefix?: string;
  ticketUrl: string;
};

/** Строка вместо ближайшей даты, когда сезон закрыт (D27). */
export type FirstScreenSeasonClosed = {
  /** «сезон 2026 закрыт». */
  label: string;
  /** День последнего события сезона для `<time>`: `YYYY-MM-DD` и словами. */
  last: { dateTime: string; date: string } | null;
};

/** Высота первого экрана: главная — на весь экран, внутренняя страница — ниже, как `.hero--page` артборда. */
export type FirstScreenSize = 'screen' | 'page';

/** Атрибуты `<img>` и `srcSet` одного источника кадра от `getImageProps`. */
export type HeroImageProps = ReturnType<typeof getImageProps>['props'];

/** Строка фактов вместо ближайшей даты у страницы без расписания: подпись, крупное значение, пояснения и цена. */
export type FirstScreenFacts = {
  label: string;
  /** Крупно, как день ближайшей даты: «270 кв. м». */
  value?: string;
  details: string[];
  /** Цена уже с разрядами и за что она: «в час». */
  price?: { value: string; note?: string };
};

/** Кнопка плашки вместо пары по умолчанию — как «Все даты», вторичная. */
export type FirstScreenAction = {
  label: string;
  href: string;
};

/**
 * То, что `canPlayHeroVideo` берет у окна: медиазапросы и Save-Data. Подходит `window`: `navigator.connection` нет
 * в типах DOM, а без `object` тип из одних необязательных полей TypeScript с `Navigator` не сопоставил бы.
 */
export type HeroVideoEnv = {
  matchMedia(query: string): { matches: boolean };
  navigator: object & { connection?: { saveData?: boolean } };
};
