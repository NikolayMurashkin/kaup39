import type { ScheduleItem } from '@/cms/types';
import { EVENT_PATH, SCHEDULE_PATH } from '@/lib/consts';
import { formatAmount, formatDay, formatWeekday, typograph } from '@/lib/format';
import type { StonePanelEvent } from '@/components/StonePanel/types';
import { TARIFF_NOTES } from './consts';

/** Самый дешевый билет события: с него начинается цена, «от» — когда видов билета несколько. */
export const cheapest = ({ tariffs }: ScheduleItem) => {
  const tariff = tariffs.reduce((least, current) => (current.amount < least.amount ? current : least), tariffs[0]);

  return {
    value: formatAmount(tariff.amount),
    prefix: tariffs.some((other) => other.amount !== tariff.amount) ? 'от' : undefined,
    note: TARIFF_NOTES[tariff.kind],
  };
};

/** «12:00 — 15:00, шоу 18:30». */
const timeOf = ({ start, end, show }: ScheduleItem) => `${start} — ${end}${show ? `, шоу ${show}` : ''}`;

export const eventHref = (item: ScheduleItem) => `${EVENT_PATH}/${item.event.slug}`;

export const toPanelEvent = (item: ScheduleItem): StonePanelEvent => {
  const price = cheapest(item);

  return {
    dateTime: item.date,
    date: `${formatDay(item.date)}, ${formatWeekday(item.date)}`,
    time: timeOf(item),
    name: typograph(item.event.title),
    price: price.value,
    pricePrefix: price.prefix,
    priceNote: price.note,
    ticketUrl: item.event.ticketUrl,
    scheduleUrl: SCHEDULE_PATH,
    scheduleLabel: 'Все даты и цены',
  };
};
