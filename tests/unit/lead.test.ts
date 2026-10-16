import { describe, expect, it } from 'vitest';
import { HONEYPOT_FIELD } from '@/lib/lead/consts';
import { leadMessage, parseLead, type Lead } from '@/lib/lead/lead';

/** Лимит длины сообщения Telegram: текст длиннее бот не отправит. */
const TELEGRAM_LIMIT = 4096;

const DEMO_MARK = 'демо Кауп';

const INPUT = {
  name: '  Проверочная Анна  ',
  phone: '+7 900 123-45-67',
  date: 'июнь 2027',
  guests: '40',
  kind: 'Корпоратив',
  comment: '  Нужен длинный дом  ',
  consent: true,
  [HONEYPOT_FIELD]: '',
};

const LEAD: Lead = {
  name: 'Проверочная Анна',
  phone: '+7 900 123-45-67',
  date: 'июнь 2027',
  guests: 40,
  kind: 'Свадьба',
  comment: 'Нужен длинный дом и огненное шоу',
  page: '/korporativy',
};

const OPTIONAL = ['date', 'guests', 'kind', 'comment'] as const;

/** Строки сообщения с подписью поля и его значением. */
const linesWith = (text: string, label: string) => text.split('\n').filter((line) => line.includes(label));

describe('разбор заявки', () => {
  it('валидный ввод: имя и комментарий без пробелов по краям, гостей числом; необязательных полей нет — нет и в заявке', () => {
    const result = parseLead(INPUT);

    expect(result.ok).toBe(true);

    const lead = (result as { lead: Lead }).lead;

    expect(lead).toMatchObject({
      name: 'Проверочная Анна',
      date: 'июнь 2027',
      guests: 40,
      kind: 'Корпоратив',
      comment: 'Нужен длинный дом',
    });
    expect(lead.phone.replace(/\D/g, '')).toBe('79001234567');

    const bare = parseLead({ name: 'Анна', phone: '89001234567', consent: true, [HONEYPOT_FIELD]: '' });

    expect(bare.ok).toBe(true);

    for (const field of OPTIONAL) {
      expect((bare as { lead: Lead }).lead, field).not.toHaveProperty(field);
    }
  });

  it('заполненная ловушка — honeypot раньше остальных проверок, даже без согласия', () => {
    expect(parseLead({ ...INPUT, [HONEYPOT_FIELD]: 'x' })).toEqual({ ok: false, reason: 'honeypot' });
    expect(parseLead({ ...INPUT, consent: false, name: '', [HONEYPOT_FIELD]: 'x' })).toEqual({
      ok: false,
      reason: 'honeypot',
    });
  });

  it('телефон со скобками, дефисами и пробелами принимается; меньше 10 или больше 15 цифр — phone', () => {
    for (const phone of ['+7 (900) 123-45-67', '8 900 123 45 67']) {
      expect(parseLead({ ...INPUT, phone }).ok, phone).toBe(true);
    }

    for (const phone of ['900 123 45 6', '1234567890123456']) {
      expect(parseLead({ ...INPUT, phone }), phone).toEqual({ ok: false, reason: 'phone' });
    }
  });
});

describe('текст заявки', () => {
  it('первая строка с пометкой «демо Кауп», у каждого поля своя строка; поля нет — нет строки; длинный комментарий короче лимита Telegram', () => {
    const text = leadMessage(LEAD);

    expect(text.split('\n')[0]).toContain(DEMO_MARK);

    expect(
      linesWith(text, 'Телефон').some((line) => line.replace(/\D/g, '').includes('79001234567')),
      'строка «Телефон» с номером',
    ).toBe(true);

    const fields: [string, string][] = [
      ['Имя', LEAD.name],
      ['Дата', LEAD.date!],
      ['Гостей', '40'],
      ['Что празднуют', LEAD.kind!],
      ['Комментарий', LEAD.comment!],
      ['Страница', LEAD.page!],
    ];

    for (const [label, value] of fields) {
      expect(
        linesWith(text, label).some((line) => line.includes(value)),
        `строка «${label}» со значением`,
      ).toBe(true);
    }

    const bare = leadMessage({ name: LEAD.name, phone: LEAD.phone, page: LEAD.page });

    for (const label of ['Дата', 'Гостей', 'Что празднуют', 'Комментарий']) {
      expect(linesWith(bare, label), label).toEqual([]);
    }

    expect(linesWith(bare, 'Имя').some((line) => line.includes(LEAD.name))).toBe(true);

    const long = leadMessage({ ...LEAD, comment: 'к'.repeat(1000) });

    expect(long).toContain('к'.repeat(1000));
    expect(long.length).toBeLessThan(TELEGRAM_LIMIT);
  });
});
