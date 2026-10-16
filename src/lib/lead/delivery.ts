import { createTransport } from 'nodemailer';
import { LEAD_TITLE, TELEGRAM_API_FALLBACK } from './consts';
import { leadMessage } from './lead';
import type { Lead, LeadMail } from './types';

/** Каналы читают окружение при каждом вызове: тесты и приемник e2e подменяют адреса после загрузки модуля. */
const envOf = (name: string) => process.env[name]?.trim() ?? '';

/**
 * Сообщение от бота студии в каждый чат из `TELEGRAM_CHAT_IDS`; ошибка любого чата — ошибка всей отправки.
 * Простой текст без `parse_mode`: разметка в имени не уронит сообщение на 400 Telegram.
 */
const sendTelegram = async (text: string) => {
  const token = envOf('TELEGRAM_BOT_TOKEN');
  const chats = envOf('TELEGRAM_CHAT_IDS')
    .split(',')
    .map((chat) => chat.trim())
    .filter(Boolean);

  if (!token || !chats.length) {
    throw new Error('Telegram не настроен: нет токена бота или списка чатов');
  }

  const api = envOf('TELEGRAM_API_URL') || TELEGRAM_API_FALLBACK;

  await Promise.all(
    chats.map(async (chat) => {
      const response = await fetch(`${api}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      });

      if (!response.ok) {
        throw new Error(`Telegram ответил ${response.status}`);
      }
    }),
  );
};

/** Письмо через SMTP студии; отправитель — `LEAD_MAIL_FROM`, без него — ящик заявок `LEAD_MAIL_TO`. */
const sendMail = async ({ to, subject, text }: LeadMail) => {
  const url = envOf('SMTP_URL');
  const from = envOf('LEAD_MAIL_FROM') || to;

  if (!url || !to || !from) {
    throw new Error('Почта не настроена: нет строки SMTP, отправителя или адреса получателя');
  }

  await createTransport(url).sendMail({ from, to, subject, text });
};

/**
 * Заявку теряет только молчание обоих каналов: упавший канал не уносит с собой второй, поэтому каналы идут
 * параллельно, а ошибки пишутся в журнал.
 */
export const deliverLead = async (lead: Lead) => {
  const text = leadMessage(lead);
  const channels = [
    ['telegram', () => sendTelegram(text)],
    ['mail', () => sendMail({ to: envOf('LEAD_MAIL_TO'), subject: `${LEAD_TITLE}: ${lead.name}`, text })],
  ] as const;

  const results = await Promise.allSettled(channels.map(([, send]) => send()));
  const failed = results.flatMap((result, index) =>
    result.status === 'rejected' ? [{ channel: channels[index][0], error: result.reason as unknown }] : [],
  );

  for (const { channel, error } of failed) {
    console.error(`Заявка не ушла в канал ${channel}:`, error);
  }

  return { delivered: results.length - failed.length };
};
