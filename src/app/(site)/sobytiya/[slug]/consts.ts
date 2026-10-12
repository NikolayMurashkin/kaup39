/** Руны над заголовками разделов страницы события — слова артборда v2. */
export const EVENT_KICKERS = {
  dates: 'Дни',
  about: 'Сага',
  includes: 'В билете',
  gallery: 'Кадры',
  way: 'В дорогу',
  refund: 'Уговор',
} as const;

/** Заголовки разделов и их якоря: по якорю `aria-labelledby` раздела находит свой заголовок. */
export const EVENT_SECTIONS = {
  dates: { id: 'dates', heading: 'Даты и\u00a0цена' },
  about: { id: 'about', heading: 'О\u00a0событии' },
  includes: { id: 'includes', heading: 'Что входит' },
  gallery: { id: 'gallery', heading: 'Фото с\u00a0события' },
  way: { id: 'way', heading: 'Как добраться' },
  refund: { id: 'refund', heading: 'Возврат билета' },
} as const;

export const DATES_TEXT = 'Билет на\u00a0каждую дату продает касса Radario.';

export const TICKET_LABEL = 'Купить билет';

/** Перед временем огненного шоу под временем даты: «огненное шоу в\u00a018:30». */
export const SHOW_PREFIX = 'огненное шоу в\u00a0';

/** Подпись пустого состояния вокруг года последней даты: «сезон 2026 закрыт». */
export const SEASON_CLOSED = { before: 'сезон\u00a0', after: ' закрыт' } as const;

export const SCHEDULE_LINK = 'Все события в\u00a0расписании';

export const LAST_DATE_NOTE = 'Последняя дата в\u00a0сезоне.';

export const EMPTY_HEADING = 'Дат пока нет';

export const EMPTY_TEXT =
  'Новые даты появятся в\u00a0расписании, как только их\u00a0объявят. Спросить о\u00a0событии можно по\u00a0телефону.';

/** Подписи над ценой: даты есть — цена этого сезона, дат больше нет — цены прошлого. */
export const PRICE_LABELS = { one: 'цена билета', many: 'цены билетов', past: 'цены прошлого сезона' } as const;

export const INCLUDES_LABELS = { includes: 'в\u00a0стоимость билета', extras: 'за\u00a0дополнительную плату' } as const;

export const WAY_LINK = 'Трансфер, автобусы и\u00a0парковка';

/** Касса одна — Radario: возврат идет через нее и по ее правилам. */
export const REFUND_TEXT =
  'Билет продает касса Radario, и\u00a0возвращает его тоже она\u00a0— по\u00a0закону №\u00a0193-ФЗ, статья\u00a052.1.';

export const REFUND_TERMS_HEAD = { when: 'Когда сдаете билет', share: 'Сколько вернут' } as const;

export const REFUND_HOW = 'как вернуть';

/** Письмо в кассу: текст до адреса и после него — со списком того, что указать, или точкой без списка. */
export const REFUND_MAIL = {
  before: 'Напишите в\u00a0кассу на\u00a0',
  withDetails: ' и\u00a0укажите:',
  bare: '.',
} as const;

export const REFUND_FULL_TEXT = 'Полный текст правил';

/** Подпись ближайшей даты в плашке первого экрана и строка вместо нее, когда будущих дат нет. */
export const NEXT_LABEL = 'ближайшая дата';

export const NO_DATES_LABEL = 'дат пока нет';

export const EVENT_KIND = 'событие';

/** Перед именем владельцев в подписи кадра первого экрана: «фото: Поселение эпохи викингов «Кауп»». */
export const PHOTO_CREDIT_PREFIX = 'фото: ';
