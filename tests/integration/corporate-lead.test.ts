import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/lead/route';
import { HONEYPOT_FIELD } from '@/lib/lead/consts';
import { startLeadSink, type LeadSink } from './lead-sink';

/**
 * Обработчик заявки с корпоративов вызывается напрямую, без сервера. Telegram и почта — заглушки в процессе теста
 * на свободных портах, их адреса подставляются в окружение перед каждым тестом: каналы читают его на каждый вызов.
 * Заявки в CMS не сохраняются, поэтому база тесту не нужна.
 */

const TOKEN = 'integration-token';

const CHATS = ['100100', '200200'];

const MAIL_TO = 'hello@mrshkn.com';

const MAIL_FROM = 'kaup39@mrshkn.com';

const DEMO_MARK = 'демо Кауп';

const PAGE_URL = 'http://localhost/korporativy';

const LEAD_ENV = [
  'TELEGRAM_API_URL',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_IDS',
  'SMTP_URL',
  'LEAD_MAIL_TO',
  'LEAD_MAIL_FROM',
];

/** Проверочная заявка: значения нарочно непохожи друг на друга, по ним ищутся поля в сообщении. */
const LEAD = {
  name: 'Проверочная Анна',
  phone: '+7 900 123-45-67',
  date: 'июнь 2027',
  guests: 40,
  kind: 'Корпоратив',
  comment: 'Нужен длинный дом и огненное шоу вечером',
};

const PHONE_DIGITS = '79001234567';

let sink: LeadSink;
let sequence = 0;
const savedEnv: Record<string, string | undefined> = {};

/** Свой адрес клиента на каждый запрос: лимит заявок живет в памяти модуля и общий на файл. */
const nextAddress = () => {
  sequence += 1;

  return `198.51.${Math.floor(sequence / 250)}.${(sequence % 250) + 1}`;
};

const send = (body: unknown, { address = nextAddress(), forwarded }: { address?: string; forwarded?: string } = {}) =>
  POST(
    new Request('http://localhost/api/lead', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': forwarded ?? address,
        referer: PAGE_URL,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const valid = (overrides: Record<string, unknown> = {}) => ({
  ...LEAD,
  consent: true,
  [HONEYPOT_FIELD]: '',
  ...overrides,
});

const expectAnswer = async (response: Response, status: number, body: Record<string, unknown>) => {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual(body);
};

const expectNothingSent = () => {
  expect(sink.calls.telegram, 'вызовы Telegram').toHaveLength(0);
  expect(sink.calls.mail, 'письма').toHaveLength(0);
};

/** Номер в тексте с любыми разделителями между цифрами: канал может записать его по-своему. */
const phonePattern = (digits: string) => new RegExp(digits.split('').join('[\\s()+-]*'));

const textOf = (call: { body: Record<string, unknown> }) => String(call.body.text ?? '');

beforeAll(async () => {
  for (const name of LEAD_ENV) {
    savedEnv[name] = process.env[name];
  }

  sink = await startLeadSink();
});

beforeEach(() => {
  sink.reset();
  process.env.TELEGRAM_API_URL = sink.telegramUrl;
  process.env.TELEGRAM_BOT_TOKEN = TOKEN;
  process.env.TELEGRAM_CHAT_IDS = CHATS.join(',');
  process.env.SMTP_URL = sink.smtpUrl;
  process.env.LEAD_MAIL_TO = MAIL_TO;
  process.env.LEAD_MAIL_FROM = MAIL_FROM;
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  for (const name of LEAD_ENV) {
    if (savedEnv[name] === undefined) delete process.env[name];
    else process.env[name] = savedEnv[name];
  }

  await sink.close();
});

describe('обработчик заявки с корпоративов', () => {
  it('без согласия — 422 consent и ни одного вызова бота и почты', async () => {
    await expectAnswer(await send(valid({ consent: false })), 422, { ok: false, reason: 'consent' });

    const { consent, ...withoutConsent } = valid();

    void consent;
    await expectAnswer(await send(withoutConsent), 422, { ok: false, reason: 'consent' });
    expectNothingSent();
  });

  it('заполненная ловушка — 200 ok, но ничего не отправлено', async () => {
    await expectAnswer(await send(valid({ [HONEYPOT_FIELD]: 'x' })), 200, { ok: true });
    expectNothingSent();
  });

  it('валидная заявка уходит в каждый чат бота и одним письмом, обе с пометкой «демо Кауп» и всеми полями', async () => {
    await expectAnswer(await send(valid()), 200, { ok: true });

    expect(sink.calls.telegram.map(({ body }) => String(body.chat_id)).sort()).toEqual([...CHATS].sort());

    for (const call of sink.calls.telegram) {
      const text = textOf(call);

      expect(call.path).toBe(`/telegram/bot${TOKEN}/sendMessage`);
      expect(call.body).not.toHaveProperty('parse_mode');
      expect(text).toContain(DEMO_MARK);
      expect(text).toContain(LEAD.name);
      expect(text).toMatch(phonePattern(PHONE_DIGITS));
      expect(text).toContain(LEAD.date);
      expect(text).toMatch(/(?<!\d)40(?!\d)/);
      expect(text).toContain(LEAD.kind);
      expect(text).toContain(LEAD.comment);
      expect(text).toContain('/korporativy');
    }

    expect(sink.calls.mail).toHaveLength(1);

    const [mail] = sink.calls.mail;

    expect(mail.to).toEqual([MAIL_TO]);
    expect(mail.subject).toContain(DEMO_MARK);
    expect(mail.text).toContain(LEAD.name);
    expect(mail.text).toMatch(phonePattern(PHONE_DIGITS));
  });

  it('разметка в имени уходит в Telegram простым текстом, как есть', async () => {
    const name = '<b>Анна</b>';

    await expectAnswer(await send(valid({ name })), 200, { ok: true });

    expect(sink.calls.telegram).toHaveLength(CHATS.length);

    for (const call of sink.calls.telegram) {
      expect(textOf(call)).toContain(name);
      expect(call.body).not.toHaveProperty('parse_mode');
    }
  });

  it('проверки полей: каждая ошибка — 422 со своей причиной и ни одного вызова', async () => {
    const cases: [string, unknown, string][] = [
      ['пустое имя', valid({ name: '' }), 'name'],
      ['имя из пробелов', valid({ name: '   ' }), 'name'],
      ['имя длиннее 100', valid({ name: 'А'.repeat(101) }), 'name'],
      ['телефон словами', valid({ phone: 'позвоните мне' }), 'phone'],
      ['9 цифр телефона', valid({ phone: '900 123 45 6' }), 'phone'],
      ['16 цифр телефона', valid({ phone: '1234567890123456' }), 'phone'],
      ['вид не из списка', valid({ kind: 'Пикник' }), 'kind'],
      ['0 гостей', valid({ guests: 0 }), 'guests'],
      ['−5 гостей', valid({ guests: -5 }), 'guests'],
      ['гостей «много»', valid({ guests: 'много' }), 'guests'],
      ['дата длиннее 100', valid({ date: 'д'.repeat(101) }), 'date'],
      ['комментарий длиннее 1000', valid({ comment: 'к'.repeat(1001) }), 'comment'],
      ['тело не JSON', '{name: Анна', 'invalid'],
    ];

    for (const [label, body, reason] of cases) {
      const response = await send(body);

      expect(response.status, label).toBe(422);
      expect(await response.json(), label).toEqual({ ok: false, reason });
    }

    expectNothingSent();
  });

  it('Telegram отвечает 502 — заявка принята, письмо ушло, ошибка в журнале', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    sink.failWith(502);
    await expectAnswer(await send(valid()), 200, { ok: true });

    expect(sink.calls.mail).toHaveLength(1);
    expect(sink.calls.mail[0].subject).toContain(DEMO_MARK);
    expect(error).toHaveBeenCalled();
  });

  it('Telegram не настроен — заявка принята, письмо ушло', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    delete process.env.TELEGRAM_BOT_TOKEN;

    await expectAnswer(await send(valid()), 200, { ok: true });

    expect(sink.calls.mail).toHaveLength(1);
    expect(sink.calls.mail[0].text).toContain(LEAD.name);
  });

  it('упали оба канала — 502 delivery', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    sink.failWith(502);
    sink.rejectMail();

    await expectAnswer(await send(valid()), 502, { ok: false, reason: 'delivery' });
  });

  it('оба канала не настроены (стенд без переменных) — 502 delivery, а не молчаливый успех', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.SMTP_URL;

    await expectAnswer(await send(valid()), 502, { ok: false, reason: 'delivery' });

    expectNothingSent();
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('11 заявок подряд с одного адреса: десять принято, одиннадцатая — 429 rate, в приемники ушло десять', async () => {
    const client = nextAddress();
    const statuses: number[] = [];
    let last: Response | null = null;

    for (let index = 1; index <= 11; index += 1) {
      // первый адрес в заголовке присылает сам клиент и меняет его как хочет; адрес клиента — последний
      last = await send(valid({ name: `Проба лимита ${index}` }), { forwarded: `10.0.0.${index}, ${client}` });
      statuses.push(last.status);
    }

    expect(statuses).toEqual([...Array(10).fill(200), 429]);
    expect(await last!.json()).toEqual({ ok: false, reason: 'rate' });
    expect(sink.calls.mail).toHaveLength(10);
    expect(new Set(sink.calls.telegram.map((call) => textOf(call).match(/Проба лимита \d+/)?.[0])).size).toBe(10);
    expect(sink.calls.telegram.some((call) => textOf(call).includes('Проба лимита 11'))).toBe(false);
  });
});
