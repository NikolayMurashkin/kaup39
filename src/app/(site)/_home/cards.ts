import { toPhoto } from '@/cms/photo';
import type { ScheduleItem } from '@/cms/types';
import type { FirstScreenNext, FirstScreenSeasonClosed } from '@/components/FirstScreen/types';
import { EVENT_PATH } from '@/lib/consts';
import { cheapest } from '@/lib/events';
import { formatAmount, formatDate, formatDay, formatTime, formatWeekday, plural } from '@/lib/format';
import type { Event, Page, Tavern } from '@/payload-types';
import {
  EVENT_FACTS_LIMIT,
  MOSAIC_BLOCK,
  MOSAIC_TAILS,
  PAST_SEASON_NOTE,
  POSITIONS_FORMS,
  TEASER_ACTION,
  TEASER_PAGES,
} from './consts';
import type { DayLabel, EventCardDates, EventCardView, MosaicSize, TeaserView } from './types';

const dayLabel = (date: string): DayLabel => ({ dateTime: date, date: formatDay(date) });

const seasonYear = (lastDate: string | null) => (lastDate ? Number(lastDate.slice(0, 4)) : null);

const cardDates = (dates: ScheduleItem[], lastDate: string | null, seasonClosed: boolean): EventCardDates => {
  const [next, ...rest] = dates;

  if (next) {
    return {
      kind: 'dated',
      next: { dateTime: next.date, date: formatDate(next.date), time: formatTime(next) },
      later: rest.length ? { ...dayLabel(rest[rest.length - 1].date), count: rest.length } : null,
    };
  }

  return seasonClosed
    ? { kind: 'closed', year: seasonYear(lastDate), last: lastDate ? dayLabel(lastDate) : null }
    : { kind: 'waiting' };
};

/**
 * Карточки событий главной — по одной на событие. События с будущими датами идут от ближайшей даты, без дат —
 * следом, в порядке коллекции. Будущих дат нет ни у кого — сезон закрыт (D27): карточки остаются, у каждой день
 * последнего события сезона, кассы нет, цены подписаны как прошлогодние.
 */
export const eventCards = (events: Event[], upcoming: ScheduleItem[], lastDate: string | null): EventCardView[] => {
  const seasonClosed = upcoming.length === 0;
  const firstIndex = (slug: string) => {
    const index = upcoming.findIndex((item) => item.event.slug === slug);

    return index === -1 ? Infinity : index;
  };

  return [...events]
    .sort((left, right) => firstIndex(left.slug) - firstIndex(right.slug))
    .map((event) => {
      const price = cheapest(event);

      return {
        slug: event.slug,
        href: `${EVENT_PATH}/${event.slug}`,
        title: event.title,
        summary: event.summary ?? null,
        facts: (event.includes ?? []).slice(0, EVENT_FACTS_LIMIT).map((item) => item.text),
        photo: toPhoto(event.photo),
        ticketUrl: event.ticketUrl,
        price: { ...price, note: seasonClosed ? PAST_SEASON_NOTE : price.note },
        dates: cardDates(
          upcoming.filter((item) => item.event.slug === event.slug),
          lastDate,
          seasonClosed,
        ),
      };
    });
};

/** Строка плашки первого экрана: ближайшая дата с кассой или, когда сезон закрыт (D27), год и последний день. */
export const firstScreen = (
  upcoming: ScheduleItem[],
  lastDate: string | null,
): { next: FirstScreenNext | null; seasonClosed?: FirstScreenSeasonClosed } => {
  const [next] = upcoming;

  if (!next) {
    const year = seasonYear(lastDate);

    return {
      next: null,
      seasonClosed: {
        label: year ? `сезон ${year} закрыт` : 'сезон закрыт',
        last: lastDate ? dayLabel(lastDate) : null,
      },
    };
  }

  return {
    next: {
      dateTime: next.date,
      date: formatDay(next.date),
      details: `${formatWeekday(next.date)}, ${formatTime(next)} · ${next.event.title}`,
      price: Math.min(...next.tariffs.map((tariff) => tariff.amount)),
      ticketUrl: next.event.ticketUrl,
    },
  };
};

/**
 * Тизеры «как доехать», кемпинга и корпоративов — карточки их страниц из CMS. Без своего заголовка и текста тизер
 * берет заголовок и подзаголовок страницы; страницы в CMS нет — нет и тизера.
 */
export const teaserCards = (pages: Page[]): TeaserView[] =>
  TEASER_PAGES.flatMap((target) => {
    const page = pages.find((candidate) => candidate.slug === target.slug);

    if (!page) return [];

    return [
      {
        ...target,
        title: page.teaser?.title || page.title,
        text: page.teaser?.text || page.lead || null,
        action: page.teaser?.action || TEASER_ACTION,
        photo: toPhoto(page.teaser?.photo),
      },
    ];
  });

/** Классы клеток мозаики по порядку кадров: целые блоки артборда, потом хвост, который тоже заполняет строки. */
export const mosaicLayout = (count: number): MosaicSize[] => [
  ...Array.from({ length: Math.floor(count / MOSAIC_BLOCK.length) }, () => MOSAIC_BLOCK).flat(),
  ...(MOSAIC_TAILS[count % MOSAIC_BLOCK.length] ?? []),
];

/** Строка под названием таверны: сколько позиций в меню и от какой цены; меню нет — строки нет. */
export const tavernSummary = (tavern: Tavern) => {
  const items = (tavern.menu ?? []).flatMap((part) => part.items ?? []);

  if (!items.length) return null;

  const from = Math.min(...items.map((item) => item.price));

  return `${items.length} ${plural(items.length, POSITIONS_FORMS)}, от ${formatAmount(from)} ₽`;
};
