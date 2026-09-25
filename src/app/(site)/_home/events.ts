import type { ScheduleItem } from '@/cms/types';
import type { StonePanelEvent } from '@/components/StonePanel/types';
import { SCHEDULE_PATH } from '@/lib/consts';
import { cheapest } from '@/lib/events';
import { formatDate, formatTime, typograph } from '@/lib/format';

export const toPanelEvent = (item: ScheduleItem): StonePanelEvent => {
  const price = cheapest(item);

  return {
    dateTime: item.date,
    date: formatDate(item.date),
    time: formatTime(item),
    name: typograph(item.event.title),
    price: price.value,
    pricePrefix: price.prefix,
    priceNote: price.note,
    ticketUrl: item.event.ticketUrl,
    scheduleUrl: SCHEDULE_PATH,
    scheduleLabel: 'Все даты и цены',
  };
};
