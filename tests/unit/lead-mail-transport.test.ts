import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { deliverLead } from '@/lib/lead/delivery';
import type { Lead } from '@/lib/lead/types';

/**
 * Почта заявки «Каупа» ходит в SMTP только по IPv4: nodemailer сам резолвит имя хоста в A и AAAA и берет адрес
 * случайно, а с сервера до почтовика по IPv6 соединения нет — ответ формы ждал почту две минуты. Транспорт должен
 * получить уже IPv4-адрес в `host`, исходное имя — в `tls.servername`, и короткие таймауты SMTP.
 *
 * nodemailer настоящий: созданный транспорт запоминается, его действующие опции — `transporter.options`. Отправка
 * подменена — сеть не трогается; Telegram — подмененный `fetch` с ответом 200. `localhost` резолвится и в `127.0.0.1`,
 * и в `::1` — случай «DNS отдает обе семьи» без сети.
 */

type TransportOptions = {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: { user?: string; pass?: string };
  tls?: { servername?: string };
  connectionTimeout?: unknown;
  greetingTimeout?: unknown;
  socketTimeout?: unknown;
};

type RecordedTransport = {
  transporter: { options: TransportOptions };
  sendMail: ReturnType<typeof vi.fn>;
};

const created = vi.hoisted(() => [] as RecordedTransport[]);

vi.mock('nodemailer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('nodemailer')>();
  const createTransport = ((...args: Parameters<typeof actual.createTransport>) => {
    const transport = actual.createTransport(...args) as unknown as RecordedTransport;

    transport.sendMail = vi.fn().mockResolvedValue({ messageId: '<probe@kaup.test>', accepted: [] });
    created.push(transport);

    return transport;
  }) as unknown as typeof actual.createTransport;

  return { ...actual, createTransport, default: { ...actual, createTransport } };
});

const LEAD_MAIL_TO = 'leads@example.com';

const TIMEOUT_LIMIT_MS = 10_000;

const LEAD: Lead = {
  name: 'Проба почты Анна',
  phone: '+7 900 123-45-67',
  kind: 'Корпоратив',
  page: '/korporativy',
};

const ENV = {
  SMTP_URL: 'smtps://hello%40mrshkn.com:secret@localhost:465',
  LEAD_MAIL_TO,
  LEAD_MAIL_FROM: 'site@mrshkn.com',
  TELEGRAM_BOT_TOKEN: 'unit-token',
  TELEGRAM_CHAT_IDS: '100100',
  TELEGRAM_API_URL: 'http://127.0.0.1:9',
};

type EnvKey = keyof typeof ENV;

const savedEnv: Partial<Record<EnvKey, string | undefined>> = {};

let errors: MockInstance<typeof console.error>;

const errorLines = () => errors.mock.calls.map((call) => call.map((part) => String(part)).join(' '));

beforeEach(() => {
  created.length = 0;

  for (const [key, value] of Object.entries(ENV) as [EnvKey, string][]) {
    savedEnv[key] = process.env[key];
    process.env[key] = value;
  }

  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 })),
  );
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  for (const key of Object.keys(ENV) as EnvKey[]) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe('транспорт почты заявки «Каупа»', () => {
  it('K1: smtps с логином на localhost — host 127.0.0.1, порт 465, secure, логин раскодирован, servername localhost, таймауты до 10 000 мс; письмо ушло на LEAD_MAIL_TO', async () => {
    await deliverLead(LEAD);

    const used = created.filter((transport) => transport.sendMail.mock.calls.length > 0);

    expect(used, `транспортов, через которые ушло письмо; лог: ${JSON.stringify(errorLines())}`).toHaveLength(1);

    const [transport] = used;
    const { options } = transport.transporter;

    expect(options.host, 'адрес SMTP — IPv4, хотя localhost дает и ::1').toBe('127.0.0.1');
    expect(options.port).toBe(465);
    expect(options.secure).toBe(true);
    expect(options.auth).toEqual({ user: 'hello@mrshkn.com', pass: 'secret' });
    expect(options.tls?.servername, 'имя для TLS — исходное имя хоста').toBe('localhost');

    for (const key of ['connectionTimeout', 'greetingTimeout', 'socketTimeout'] as const) {
      const value = options[key];

      expect(typeof value, `${key}: ${String(value)}`).toBe('number');
      expect(value as number, key).toBeGreaterThan(0);
      expect(value as number, key).toBeLessThanOrEqual(TIMEOUT_LIMIT_MS);
    }

    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: LEAD_MAIL_TO }));
  });

  it('K3: без порта — 465 для smtps и 587 для smtp; IPv4-литерал — host как есть, без servername; пароль раскодирован', async () => {
    const optionsFor = async (smtpUrl: string) => {
      created.length = 0;
      process.env.SMTP_URL = smtpUrl;
      await deliverLead(LEAD);

      const used = created.filter((transport) => transport.sendMail.mock.calls.length > 0);

      expect(
        used,
        `транспортов, через которые ушло письмо (${smtpUrl}); лог: ${JSON.stringify(errorLines())}`,
      ).toHaveLength(1);

      return used[0].transporter.options;
    };

    expect((await optionsFor('smtps://localhost')).port, 'smtps без порта').toBe(465);
    expect((await optionsFor('smtp://localhost')).port, 'smtp без порта').toBe(587);

    const literal = await optionsFor('smtp://127.0.0.1:2525');

    expect(literal.host).toBe('127.0.0.1');
    expect(literal.tls?.servername, 'у IP-литерала имени для TLS нет').toBeUndefined();

    expect((await optionsFor('smtps://hello%40mrshkn.com:s%40cret@localhost:465')).auth).toEqual({
      user: 'hello@mrshkn.com',
      pass: 's@cret',
    });
  });

  it('K4: битый % в пароле не роняет почту — пароль уходит как есть', async () => {
    process.env.SMTP_URL = 'smtps://hello%40mrshkn.com:50%zz@localhost:465';

    await deliverLead(LEAD);

    const used = created.filter((transport) => transport.sendMail.mock.calls.length > 0);

    expect(used, `транспортов, через которые ушло письмо; лог: ${JSON.stringify(errorLines())}`).toHaveLength(1);
    expect(used[0].transporter.options.auth).toEqual({ user: 'hello@mrshkn.com', pass: '50%zz' });
  });

  it('K2: SMTP только по IPv6 — канал почты отказал: не засчитан, в логе «не ушла в канал mail», письмо не ушло', async () => {
    process.env.SMTP_URL = 'smtp://[::1]:2525';

    const result = await deliverLead(LEAD);

    expect(result.delivered, 'засчитан только Telegram').toBe(1);
    expect(
      errorLines().some((line) => line.includes('Заявка не ушла в канал mail')),
      `в логе нет «Заявка не ушла в канал mail»; было: ${JSON.stringify(errorLines())}`,
    ).toBe(true);
    expect(
      created.flatMap((transport) => transport.sendMail.mock.calls),
      'отправок через транспорт без IPv4-адреса',
    ).toEqual([]);
  });
});
