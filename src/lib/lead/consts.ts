/** Поле-ловушка формы заявки: человек его не видит и не заполняет, бот заполняет. */
export const HONEYPOT_FIELD = 'website';

/** Что празднуют: виды мероприятий формы заявки по артборду. */
export const LEAD_KINDS = [
  'Корпоратив',
  'Свадьба',
  'День рождения',
  'Выпускной',
  'Ролевая игра',
  'Съемка клипа',
  'Другое',
] as const;

/** Пометка заявки в боте и в теме письма: заявка пришла с демо-версии, а не с сайта поселения. */
export const DEMO_MARK = 'демо Кауп';

/** Длины полей заявки: так длинный текст не упрется в лимит сообщения Telegram (4096 знаков). */
export const LEAD_LIMITS = {
  name: 100,
  date: 100,
  comment: 1000,
  guests: 10000,
} as const;

/** Сколько цифр в телефоне: номер с кодом страны, но не длиннее международного формата. */
export const PHONE_DIGITS = { min: 10, max: 15 } as const;

/** Телефон — цифры, пробелы, скобки, дефисы и плюс в начале. */
export const PHONE_PATTERN = /^\+?[\d\s()-]+$/;

/** Подписи строк сообщения заявки. */
export const LEAD_LABELS = {
  name: 'Имя',
  phone: 'Телефон',
  date: 'Дата',
  guests: 'Гостей',
  kind: 'Что празднуют',
  comment: 'Комментарий',
  page: 'Страница',
} as const;

/** Первая строка сообщения и тема письма. */
export const LEAD_TITLE = `Заявка на мероприятие — ${DEMO_MARK}`;

/** Лимит заявок с одного адреса: десять за десять минут, дальше 429. */
export const LEAD_RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

/** Сколько адресов помнит лимит, прежде чем выбросить протухшие. */
export const RATE_LIMIT_MAX_KEYS = 1000;

/** Адрес Bot API, если окружение не задало свой. */
export const TELEGRAM_API_FALLBACK = 'https://api.telegram.org';

/** Таймауты SMTP: соединения, приветствия и сокета. У nodemailer по умолчанию 2 мин, 30 с и 10 мин. */
export const SMTP_TIMEOUT_MS = 10_000;

/** Порт SMTP, если строка его не задала: как у nodemailer — 465 для `smtps:`, 587 для `smtp:`. */
export const SMTP_DEFAULT_PORT = { secure: 465, plain: 587 } as const;
