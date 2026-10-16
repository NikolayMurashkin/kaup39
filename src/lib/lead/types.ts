/** Заявка на мероприятие после проверки полей; `page` — путь страницы, с которой ее отправили. */
export type Lead = {
  name: string;
  phone: string;
  date?: string;
  guests?: number;
  kind?: string;
  comment?: string;
  page?: string;
};

/** Почему заявка не принята: ловушка, поле или тело запроса. */
export type LeadReason = 'honeypot' | 'consent' | 'name' | 'phone' | 'kind' | 'guests' | 'date' | 'comment' | 'invalid';

export type LeadResult = { ok: true; lead: Lead } | { ok: false; reason: LeadReason };

/** Ответ обработчика заявки форме: причина отказа — поле, лимит, доставка или тело запроса. */
export type LeadAnswer = { ok: true } | { ok: false; reason: Exclude<LeadReason, 'honeypot'> | 'rate' | 'delivery' };

export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
};

export type LeadMail = {
  to: string;
  subject: string;
  text: string;
};
