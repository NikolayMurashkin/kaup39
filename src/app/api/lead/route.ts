import { LEAD_RATE_LIMIT } from '@/lib/lead/consts';
import { deliverLead } from '@/lib/lead/delivery';
import { parseLead } from '@/lib/lead/lead';
import { createRateLimiter } from '@/lib/lead/rate-limit';
import type { LeadAnswer } from '@/lib/lead/types';

const limiter = createRateLimiter(LEAD_RATE_LIMIT);

/**
 * Берется последний адрес в `x-forwarded-for`, а не первый: первый присылает сам клиент, и лимит обходился бы
 * одной строкой заголовка. Последний дописывает прокси перед приложением — ему и верим.
 */
const addressOf = (request: Request) => {
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((address) => address.trim())
    .filter(Boolean);

  return forwarded?.at(-1) || request.headers.get('x-real-ip') || 'unknown';
};

/** Страница, с которой ушла заявка: путь из `referer`, без него — неизвестна. */
const pageOf = (request: Request) => {
  const referer = request.headers.get('referer');

  if (!referer) return undefined;

  try {
    return new URL(referer).pathname;
  } catch {
    return undefined;
  }
};

const answer = (body: LeadAnswer, status = 200) => Response.json(body, { status });

/**
 * Заявка на мероприятие с демо-версии: в бот и на почту студии, в CMS не сохраняется — персональных данных в базе
 * демо нет. Ловушке отвечаем как человеку: по ответу бот не поймет, что его раскусили.
 */
export const POST = async (request: Request): Promise<Response> => {
  if (!limiter.allow(addressOf(request))) {
    return answer({ ok: false, reason: 'rate' }, 429);
  }

  const input: unknown = await request.json().catch(() => null);
  const result = parseLead(input);

  if (!result.ok) {
    return result.reason === 'honeypot' ? answer({ ok: true }) : answer({ ok: false, reason: result.reason }, 422);
  }

  const page = pageOf(request);
  const { delivered } = await deliverLead(page ? { ...result.lead, page } : result.lead);

  return delivered ? answer({ ok: true }) : answer({ ok: false, reason: 'delivery' }, 502);
};
