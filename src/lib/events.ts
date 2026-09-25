import type { ScheduleItem } from '@/cms/types';
import { EVENT_PATH, TARIFF_NOTES } from './consts';
import { formatAmount } from './format';

/** Самый дешевый билет события: с него начинается цена, «от» — когда видов билета несколько. */
export const cheapest = ({ tariffs }: Pick<ScheduleItem, 'tariffs'>) => {
  const tariff = tariffs.reduce((least, current) => (current.amount < least.amount ? current : least), tariffs[0]);

  return {
    value: formatAmount(tariff.amount),
    prefix: tariffs.some((other) => other.amount !== tariff.amount) ? 'от' : undefined,
    note: TARIFF_NOTES[tariff.kind],
  };
};

export const eventHref = (item: ScheduleItem) => `${EVENT_PATH}/${item.event.slug}`;
