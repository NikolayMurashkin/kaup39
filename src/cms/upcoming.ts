import { SETTLEMENT_TIME_ZONE } from './consts';

/** `sv-SE` печатает момент как `YYYY-MM-DD HH:MM` — такую строку можно сравнивать с датой расписания как есть. */
const momentFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: SETTLEMENT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * Даты, которые еще не прошли: событие остается в списке, пока не закончилось, — сегодняшнее дневное
 * видно до 15:00, а в 16:00 уже нет. Время сравнивается по Калининграду, а не по часам сервера.
 */
export const upcoming = <T extends { date: string; start: string; end: string }>(items: T[], now: Date): T[] => {
  const moment = momentFormat.format(now);

  return items.filter((item) => `${item.date} ${item.end}` > moment);
};
