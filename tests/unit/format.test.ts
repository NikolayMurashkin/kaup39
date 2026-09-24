import { describe, expect, it } from 'vitest';
import { formatAmount, formatDay, formatWeekday, paragraphs, phoneHref, typograph } from '@/lib/format';

const NBSP = '\u00a0';

describe('форматтеры главной', () => {
  it.each([
    ['2026-09-27', '27 сентября', 'воскресенье'],
    ['2026-10-03', '3 октября', 'суббота'],
    ['2027-01-01', '1 января', 'пятница'],
    ['2026-05-16', '16 мая', 'суббота'],
  ])('%s — «%s», %s', (date, day, weekday) => {
    expect(formatDay(date)).toBe(day);
    expect(formatWeekday(date)).toBe(weekday);
  });

  it.each([
    [700, '700'],
    [2700, '2700'],
    [12400, '12 400'],
    [1250000, '1 250 000'],
  ])('%i ₽ пишется как «%s»: четырехзначные слитно, дальше разряды через неразрывный пробел', (amount, text) => {
    expect(formatAmount(amount)).toBe(text);
  });
});

describe('типограф текстов из CMS', () => {
  it.each([
    ['Дом в лесу', `Дом в${NBSP}лесу`],
    ['В поселке и на берегу', `В${NBSP}поселке и${NBSP}на${NBSP}берегу`],
    ['Кузница, гончарная мастерская и в конце — тир', `Кузница, гончарная мастерская и${NBSP}в${NBSP}конце — тир`],
    ['(с 12:00 до 15:00)', `(с${NBSP}12:00 до${NBSP}15:00)`],
    ['Ива вдоль реки', 'Ива вдоль реки'],
  ])('«%s»', (source, expected) => {
    expect(typograph(source)).toBe(expected);
  });

  it('абзацы разделяются пустой строкой, пустые отбрасываются, типограф применяется к каждому', () => {
    expect(paragraphs('Первый в строке.\n\n\n  Второй и последний.  \n\n')).toEqual([
      `Первый в${NBSP}строке.`,
      `Второй и${NBSP}последний.`,
    ]);
    expect(paragraphs(null)).toEqual([]);
  });
});

describe('ссылка для звонка', () => {
  it.each([
    ['8 (4012) 37-99-26', 'tel:+74012379926'],
    ['+7 (4012) 37-99-26', 'tel:+74012379926'],
    ['37-99-26', 'tel:379926'],
  ])('«%s» → %s', (phone, href) => {
    expect(phoneHref(phone)).toBe(href);
  });
});
