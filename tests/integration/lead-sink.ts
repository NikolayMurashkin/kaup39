import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { SMTPServer } from 'smtp-server';

/** Вызов заглушки Telegram: путь запроса и тело JSON. */
export type TelegramCall = { path: string; body: Record<string, unknown> };

/** Письмо, принятое заглушкой SMTP: получатели из конверта, раскодированные тема и текст. */
export type MailCall = { to: string[]; subject: string; text: string };

export type LeadSink = {
  telegramUrl: string;
  smtpUrl: string;
  calls: { telegram: TelegramCall[]; mail: MailCall[] };
  /** Telegram отвечает этим статусом, пока не вызван `reset`. */
  failWith: (status: number) => void;
  /** SMTP отвергает письма, пока не вызван `reset`. */
  rejectMail: () => void;
  /** Чистит вызовы и возвращает обоим каналам успешные ответы. */
  reset: () => void;
  close: () => Promise<void>;
};

const readBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
};

const decodeQuotedPrintable = (body: string) => {
  const bytes: number[] = [];
  const unfolded = body.replace(/=\r\n/g, '');

  for (let index = 0; index < unfolded.length; index += 1) {
    if (unfolded[index] === '=' && /^[0-9A-Fa-f]{2}$/.test(unfolded.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(unfolded.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }

    bytes.push(...Buffer.from(unfolded[index], 'utf8'));
  }

  return Buffer.from(bytes).toString('utf8');
};

/** Тема с кириллицей приходит словами `=?UTF-8?B?…?=` или `=?UTF-8?Q?…?=`, иногда в несколько строк. */
const decodeHeader = (value: string) =>
  value
    .replace(/\r\n[ \t]+/g, ' ')
    .replace(/\?=\s+=\?/g, '?==?')
    .replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, _charset: string, encoding: string, text: string) =>
      encoding.toUpperCase() === 'B'
        ? Buffer.from(text, 'base64').toString('utf8')
        : decodeQuotedPrintable(text.replace(/_/g, ' ')),
    );

/** Письмо приходит закодированным, иногда из нескольких частей: раскодируется каждая. */
const decodeBody = (raw: string): string => {
  const separator = raw.indexOf('\r\n\r\n');
  const head = raw.slice(0, separator);
  const body = raw.slice(separator + 4);
  const boundary = head.match(/boundary="?([^";\r\n]+)"?/i)?.[1];

  if (/content-type:\s*multipart\//i.test(head) && boundary) {
    return body
      .split(`--${boundary}`)
      .slice(1)
      .filter((part) => !part.startsWith('--'))
      .map((part) => decodeBody(part.replace(/^\r\n/, '')))
      .join('\n');
  }

  if (/content-transfer-encoding:\s*base64/i.test(head)) {
    return Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8');
  }

  if (/content-transfer-encoding:\s*quoted-printable/i.test(head)) {
    return decodeQuotedPrintable(body);
  }

  return body;
};

const subjectOf = (raw: string) => {
  const head = raw.slice(0, raw.indexOf('\r\n\r\n'));
  const line = head.match(/^subject:((?:.*)(?:\r\n[ \t].*)*)/im)?.[1] ?? '';

  return decodeHeader(line.trim());
};

const listen = (server: Server | SMTPServer) =>
  new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

const portOf = (server: Server) => (server.address() as AddressInfo).port;

/**
 * Приемник заявки в процессе теста: HTTP-заглушка Telegram (`<api>/bot<token>/sendMessage`) и SMTP-сервер, оба
 * на свободных портах. Сеть наружу тест не трогает, секретов не нужно.
 */
export const startLeadSink = async (): Promise<LeadSink> => {
  const calls: LeadSink['calls'] = { telegram: [], mail: [] };
  let telegramStatus = 200;
  let mailRejected = false;

  const http = createServer(async (request, response) => {
    const text = await readBody(request);
    let body: Record<string, unknown> = {};

    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      body = Object.fromEntries(new URLSearchParams(text));
    }

    calls.telegram.push({ path: new URL(request.url ?? '/', 'http://127.0.0.1').pathname, body });
    response.writeHead(telegramStatus, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify(
        telegramStatus === 200
          ? { ok: true, result: { message_id: calls.telegram.length } }
          : { ok: false, error_code: telegramStatus, description: 'Bad Gateway' },
      ),
    );
  });

  const smtp = new SMTPServer({
    authOptional: true,
    hideSTARTTLS: true,
    disableReverseLookup: true,
    logger: false,
    onData(stream, session, callback) {
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        if (mailRejected) {
          callback(Object.assign(new Error('Письмо отвергнуто заглушкой'), { responseCode: 550 }));

          return;
        }

        const raw = Buffer.concat(chunks).toString('utf8');

        calls.mail.push({
          to: session.envelope.rcptTo.map(({ address }) => address),
          subject: subjectOf(raw),
          text: decodeBody(raw),
        });
        callback();
      });
    },
  });

  await listen(http);
  await listen(smtp);

  const smtpPort = ((smtp as unknown as { server: Server }).server.address() as AddressInfo).port;

  return {
    telegramUrl: `http://127.0.0.1:${portOf(http)}/telegram`,
    smtpUrl: `smtp://127.0.0.1:${smtpPort}`,
    calls,
    failWith: (status) => {
      telegramStatus = status;
    },
    rejectMail: () => {
      mailRejected = true;
    },
    reset: () => {
      calls.telegram.length = 0;
      calls.mail.length = 0;
      telegramStatus = 200;
      mailRejected = false;
    },
    close: async () => {
      http.closeAllConnections();
      await new Promise((resolve) => http.close(resolve));
      await new Promise((resolve) => smtp.close(() => resolve(undefined)));
    },
  };
};
