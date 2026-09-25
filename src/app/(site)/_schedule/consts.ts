/** Параметры адреса, в которых живут фильтры: ссылку с фильтром можно отправить, и она откроется так же. */
export const FILTER_PARAMS = { month: 'month', event: 'event' } as const;

/** Якорь фильтров и списка дат: после выбора фильтра страница открывается на нем, а не на шапке. */
export const DATES_ANCHOR = 'dates';

export const SCHEDULE_TITLE = 'Расписание и цены';

export const SCHEDULE_LEAD =
  'Все даты сезона и цены билетов. Билет на каждую дату продает касса Radario — кнопка у даты открывает ее страницу.';
