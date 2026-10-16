import {
  HONEYPOT_FIELD,
  LEAD_KINDS,
  LEAD_LABELS,
  LEAD_LIMITS,
  LEAD_TITLE,
  PHONE_DIGITS,
  PHONE_PATTERN,
} from './consts';
import type { Lead, LeadReason, LeadResult } from './types';

export type { Lead, LeadReason, LeadResult } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Необязательная строка: нет поля или одни пробелы — `undefined`, не строка — `null` (ошибка поля). */
const optionalText = (value: unknown): string | undefined | null => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return null;

  return value.trim() || undefined;
};

const parseGuests = (value: unknown): number | undefined | null => {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return undefined;

  const count = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : Number.NaN;

  return Number.isInteger(count) && count >= 1 && count <= LEAD_LIMITS.guests ? count : null;
};

const validPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '').length;

  return PHONE_PATTERN.test(phone) && digits >= PHONE_DIGITS.min && digits <= PHONE_DIGITS.max;
};

const fail = (reason: LeadReason): LeadResult => ({ ok: false, reason });

/**
 * Разбор тела заявки. Ловушка проверяется первой: боту отвечают как человеку, и по причине отказа нельзя понять,
 * какое поле его выдало. Необязательные поля без значения в заявку не попадают.
 */
export const parseLead = (input: unknown): LeadResult => {
  if (!isRecord(input)) return fail('invalid');

  const trap = input[HONEYPOT_FIELD];

  if (typeof trap === 'string' ? trap.trim() : trap) return fail('honeypot');
  if (input.consent !== true) return fail('consent');

  const name = typeof input.name === 'string' ? input.name.trim() : '';

  if (!name || name.length > LEAD_LIMITS.name) return fail('name');

  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';

  if (!validPhone(phone)) return fail('phone');

  const kind = optionalText(input.kind);

  if (kind === null || (kind && !(LEAD_KINDS as readonly string[]).includes(kind))) return fail('kind');

  const guests = parseGuests(input.guests);

  if (guests === null) return fail('guests');

  const date = optionalText(input.date);

  if (date === null || (date && date.length > LEAD_LIMITS.date)) return fail('date');

  const comment = optionalText(input.comment);

  if (comment === null || (comment && comment.length > LEAD_LIMITS.comment)) return fail('comment');

  return {
    ok: true,
    lead: {
      name,
      phone,
      ...(date ? { date } : {}),
      ...(guests ? { guests } : {}),
      ...(kind ? { kind } : {}),
      ...(comment ? { comment } : {}),
    },
  };
};

/** Текст заявки для бота и письма: простой текст без разметки, первая строка — с пометкой демо. */
export const leadMessage = (lead: Lead): string => {
  const rows: [string, string | number | undefined][] = [
    [LEAD_LABELS.name, lead.name],
    [LEAD_LABELS.phone, lead.phone],
    [LEAD_LABELS.date, lead.date],
    [LEAD_LABELS.guests, lead.guests],
    [LEAD_LABELS.kind, lead.kind],
    [LEAD_LABELS.comment, lead.comment],
    [LEAD_LABELS.page, lead.page],
  ];

  return [
    LEAD_TITLE,
    ...rows.flatMap(([label, value]) => (value === undefined || value === '' ? [] : [`${label}: ${value}`])),
  ].join('\n');
};
