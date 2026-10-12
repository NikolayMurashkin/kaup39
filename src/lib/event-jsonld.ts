import type { TariffKind } from '@/cms/types';
import { upcoming } from '@/cms/upcoming';
import { SETTLEMENT_OFFSET } from './consts';

export type EventJsonLdInput = {
  title: string;
  ticketUrl: string;
  tariffs: { kind: TariffKind; amount: number }[];
  dates: { date: string; start: string; end: string }[];
  place: { name: string; address: string };
};

/** Момент даты расписания по Калининграду: `2026-10-17T12:00:00+02:00`. */
const moment = (date: string, time: string) => `${date}T${time}:00${SETTLEMENT_OFFSET}`;

/**
 * Разметка schema.org `Event` — по объекту на каждую дату, которая еще не закончилась: граница та же, что у списка
 * дат на странице (`upcoming`). В `offers` — самый дешевый билет, как «от» в цене страницы.
 */
export const eventJsonLd = (
  { title, ticketUrl, tariffs, dates, place }: EventJsonLdInput,
  now: Date,
): Record<string, unknown>[] => {
  const price = Math.min(...tariffs.map((tariff) => tariff.amount));

  return upcoming(dates, now).map(({ date, start, end }) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    startDate: moment(date, start),
    endDate: moment(date, end),
    location: { '@type': 'Place', name: place.name, address: place.address },
    offers: { '@type': 'Offer', price, priceCurrency: 'RUB', url: ticketUrl },
  }));
};

/**
 * JSON для `<script type="application/ld+json">`: `<` записан как `<`, поэтому текст из CMS с `</script>`
 * не закрывает тег, а `JSON.parse` читает строку обратно без изменений.
 */
export const jsonLdScript = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c');
