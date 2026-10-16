import { createServer, type IncomingMessage } from 'node:http';
import { SMTPServer } from 'smtp-server';
import type { SinkCall } from './types.ts';

/**
 * Приемник заявок e2e вместо Telegram и почты: `POST /telegram/bot<token>/sendMessage`, SMTP, `GET`/`DELETE /calls`.
 * Порты приходят окружением из `playwright.config.ts`: `consts.ts` тянет модули приложения, которые Node без сборщика
 * не загрузит.
 */
const HTTP_PORT = Number(process.env.SINK_HTTP_PORT);
const SMTP_PORT = Number(process.env.SINK_SMTP_PORT);

const calls: SinkCall[] = [];

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

/** Письмо целиком для поиска: раскодированная тема и текст. */
const decodeMessage = (raw: string) => {
  const head = raw.slice(0, raw.indexOf('\r\n\r\n'));
  const subject = head.match(/^subject:((?:.*)(?:\r\n[ \t].*)*)/im)?.[1] ?? '';

  return `Subject: ${decodeHeader(subject.trim())}\n${decodeBody(raw)}`;
};

const http = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${HTTP_PORT}`);

  if (request.method === 'GET' && url.pathname === '/calls') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(calls));

    return;
  }

  if (request.method === 'DELETE' && url.pathname === '/calls') {
    calls.length = 0;
    response.writeHead(204);
    response.end();

    return;
  }

  if (request.method === 'POST' && url.pathname.startsWith('/telegram/')) {
    calls.push({ channel: 'telegram', body: await readBody(request) });
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, result: { message_id: calls.length } }));

    return;
  }

  response.writeHead(404);
  response.end();
});

const smtp = new SMTPServer({
  authOptional: true,
  hideSTARTTLS: true,
  disableReverseLookup: true,
  logger: false,
  onData(stream, _session, callback) {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => {
      calls.push({ channel: 'mail', body: decodeMessage(Buffer.concat(chunks).toString('utf8')) });
      callback();
    });
  },
});

http.listen(HTTP_PORT, '127.0.0.1');
smtp.listen(SMTP_PORT, '127.0.0.1');
