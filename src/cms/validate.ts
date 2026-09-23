import { FOREIGN_TICKET_HOST, SLUG_PATTERN, TICKET_HOST, TIME_PATTERN } from './consts';

/**
 * Касса одна — Radario. Адрес разбирается целиком, а не ищется подстрокой: так не проходят
 * `https://https://radario.ru/…` с исходной `/teatr`, чужой домен с `radario.ru` в параметрах
 * и поддомен-двойник `radario.ru.example.com`.
 */
export const validateTicketUrl = (value: string | null | undefined): true | string => {
  const message = `Ссылка на билет ведет только в кассу Radario: https://${TICKET_HOST}/…`;

  return value?.startsWith(`https://${TICKET_HOST}/`) && URL.canParse(value) && new URL(value).hostname === TICKET_HOST
    ? true
    : message;
};

/**
 * Ссылки в разделах страниц и в соцсетях: полный адрес с https и мимо второй кассы — кнопку
 * «Купить билет» можно поставить и сюда, поэтому запрет не только на поле события. Имя кассы ищется
 * и в адресе как он есть, и в разобранном хосте: так не проходят точка в конце хоста, `%2E`,
 * двойная схема и закодированные буквы, которые парсер раскрывает.
 */
export const validateLinkUrl = (value: string | null | undefined): true | string => {
  if (!value || !URL.canParse(value) || new URL(value).protocol !== 'https:') return 'Полный адрес, начиная с https://';

  const foreignName = FOREIGN_TICKET_HOST.split('.')[0];

  return [value, new URL(value).hostname].some((text) => text.toLowerCase().includes(foreignName))
    ? `Касса одна — Radario: ссылки на ${FOREIGN_TICKET_HOST} не сохраняются`
    : true;
};

export const validateOptionalLinkUrl = (value: string | null | undefined): true | string =>
  value ? validateLinkUrl(value) : true;

export const validateSlug = (value: string | null | undefined): true | string =>
  value && SLUG_PATTERN.test(value) ? true : 'Латиница, цифры и дефис, например denvikingi';

export const validateOptionalSlug = (value: string | null | undefined): true | string =>
  value ? validateSlug(value) : true;

export const validateTime = (value: string | null | undefined): true | string =>
  value && TIME_PATTERN.test(value) ? true : 'Время в виде ЧЧ:ММ, например 12:00';

export const validateOptionalTime = (value: string | null | undefined): true | string =>
  value ? validateTime(value) : true;

/** Конец события позже начала: «с 12:00 до 12:00» с исходной `/tur` сюда не пройдет. */
export const validateEnd = (
  value: string | null | undefined,
  { siblingData }: { siblingData: { start?: string | null } },
): true | string => {
  const time = validateTime(value);

  if (time !== true) return time;

  return siblingData.start && value! <= siblingData.start ? 'Конец должен быть позже начала' : true;
};
