import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EventContent } from '@/app/(site)/sobytiya/[slug]/EventContent';
import { EVENT_FACTS } from '@/cms/facts';
import type { ScheduleItem } from '@/cms/types';
import { phoneHref } from '@/lib/format';
import type { Event, Media, Site } from '@/payload-types';

const TICKET_URL = EVENT_FACTS.find((fact) => fact.slug === 'denvikingi')!.ticketUrl;

/** Две льготы с исходной страницы `/denvikingi`, первая — с категориями. */
const PERKS = [
  'Льготный билет — 500 ₽, на кассе по документам: пенсионерам, ветеранам, инвалидам, многодетным семьям',
  'Дети до 6 лет бесплатно',
];

const photo = (id: number, file: string, alt: string): Media => ({
  id,
  alt,
  caption: null,
  temporary: false,
  url: `/api/media/file/${file}`,
  filename: file,
  width: 1600,
  height: 1000,
  updatedAt: '2026-09-28T00:00:00.000Z',
  createdAt: '2026-09-28T00:00:00.000Z',
});

/** Событие с льготами. */
const EVENT = {
  id: 1,
  slug: 'denvikingi',
  title: 'День с викингами',
  ageRating: '6+',
  summary: 'Экскурсия по поселению, ремесла и бои викингов.',
  description: 'Гости проходят поселение с экскурсоводом.\n\nПотом — ремесла и показательные бои.',
  tariffs: [{ kind: 'entry', amount: 700 }],
  includes: [{ text: 'Экскурсия по поселению' }, { text: 'Показательные бои' }],
  perks: PERKS.map((text) => ({ text })),
  gallery: [
    photo(11, 'boi.jpg', 'Показательный бой на поле'),
    photo(12, 'kuznica.jpg', 'Кузнец у горна'),
    photo(13, 'drakkar.jpg', 'Драккар у причала'),
  ],
  ticketUrl: TICKET_URL,
  updatedAt: '2026-09-28T00:00:00.000Z',
  createdAt: '2026-09-28T00:00:00.000Z',
} as Event;

/** Сроки возврата: две строки таблицы артборда v2. */
const TERMS = [
  { when: 'Более чем за 10 дней', share: '100 %' },
  { when: 'За 5–10 дней', share: '50 %' },
];

/** Придуманные контакты: телефон не совпадает с телефоном владельцев из артборда. */
const SITE: Site = {
  id: 1,
  name: 'Поселение эпохи викингов «Кауп»',
  address: 'Калининградская область, Зеленоградский район, 4 км от п. Романово',
  map: { latitude: 54.878, longitude: 20.277 },
  phone: '8 (4012) 11-22-33',
  email: 'test@example.com',
  refund: {
    title: 'Возврат билетов',
    terms: TERMS,
    body: 'Вернуть билет можно не позднее чем за 10 дней до события.',
    email: 'support@radario.ru',
    details: [{ text: 'Номер заказа' }, { text: 'ФИО, на кого приобретали билет' }],
  },
};

const dateOf = (id: number, date: string, ticketUrl = TICKET_URL): ScheduleItem => ({
  id,
  date,
  start: '12:00',
  end: '15:00',
  show: null,
  event: { slug: EVENT.slug, title: EVENT.title, ticketUrl },
  tariffs: [{ kind: 'entry', amount: 700 }],
});

const DATES = [dateOf(1, '2026-10-10'), dateOf(2, '2026-10-17'), dateOf(3, '2026-10-24')];

/** 12 октября, 12:00 по Калининграду: 10 октября прошло, 17 и 24 впереди. */
const NOW = new Date('2026-10-12T10:00:00Z');

const noop = () => undefined;

const ROUTER: AppRouterInstance = {
  back: noop,
  forward: noop,
  refresh: noop,
  push: noop,
  replace: noop,
  prefetch: noop,
  bfcacheId: 'test',
};

const render = ({
  event = EVENT,
  dates = DATES,
  now = NOW,
  site = SITE,
}: { event?: Event; dates?: ScheduleItem[]; now?: Date; site?: Site } = {}) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={ROUTER}>
      <EventContent
        event={event}
        dates={dates}
        site={site}
        now={now}
      />
    </AppRouterContext.Provider>,
  );

/** Текст без разметки: неразрывные пробелы и сущности — обычными знаками. */
const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;| /g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Атрибут `href` после разбора: сущности HTML — обычными знаками. */
const decodeAttribute = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

type Link = { rawHref: string; href: string; html: string };

/** Ссылки с текстом «Купить билет». */
const ticketLinks = (markup: string): Link[] =>
  [...markup.matchAll(/<a\b([^>]*)>((?:(?!<\/a>)[\s\S])*)<\/a>/g)]
    .filter(([, , body]) => plain(body).includes('Купить билет'))
    .map(([html, attributes]) => {
      const rawHref = / href="([^"]*)"/.exec(attributes)?.[1] ?? '';

      return { rawHref, href: decodeAttribute(rawHref), html };
    });

/** Строка над заголовком первого экрана — абзац прямо перед `<h1>`. */
const kindOf = (markup: string) => plain(/<p\b[^>]*>((?:(?!<\/p>)[\s\S])*)<\/p>\s*<h1\b/.exec(markup)?.[1] ?? '');

/** Первый экран — от начала разметки до раздела дат. */
const firstScreenOf = (markup: string) => markup.slice(0, markup.indexOf('id="dates"'));

/** Раздел возврата — от его якоря до конца разметки. */
const refundOf = (markup: string) => {
  const start = markup.indexOf('id="refund"');

  return start === -1 ? '' : markup.slice(start);
};

const JSON_LD = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

const jsonLdBlocks = (markup: string) => [...markup.matchAll(JSON_LD)].map(([, body]) => body);

/** Объекты Event разметки: массив или `@graph`. */
const eventsOf = (json: string) => {
  const data = JSON.parse(json) as unknown;
  const items = Array.isArray(data) ? data : ((data as { '@graph'?: unknown[] })['@graph'] ?? [data]);

  return items as { '@type'?: string; startDate?: string }[];
};

describe('страница события', () => {
  it('каждая кнопка «Купить билет» ведет на адрес кассы из CMS дословно, с одной схемой https', () => {
    const links = ticketLinks(render());

    expect(links.length).toBeGreaterThanOrEqual(2);

    for (const { href } of links) {
      expect(href).toBe(TICKET_URL);
      expect(href.startsWith('https://radario.ru/')).toBe(true);
      expect(href).toMatch(/^https:\/\/(?!https?:)/);
      expect(href.indexOf('https://', 1)).toBe(-1);
    }
  });

  it('JSON-LD — один скрипт с Event на каждую будущую дату, прошедшей даты нет ни в строках, ни в разметке', () => {
    const markup = render();
    const blocks = jsonLdBlocks(markup);

    expect(blocks).toHaveLength(1);

    const events = eventsOf(blocks[0]);

    expect(events.map((item) => item['@type'])).toEqual(['Event', 'Event']);
    expect(events.map((item) => item.startDate)).toEqual(['2026-10-17T12:00:00+02:00', '2026-10-24T12:00:00+02:00']);

    const visible = markup.replace(JSON_LD, '');

    expect(visible).toContain('2026-10-17');
    expect(visible).toContain('2026-10-24');
    expect(markup).not.toContain('2026-10-10');
  });

  it('все даты прошли — нет JSON-LD и кнопок билета, есть пустое состояние с телефоном владельцев', () => {
    const markup = render({ now: new Date('2026-10-25T12:00:00Z') });

    expect(jsonLdBlocks(markup)).toEqual([]);
    expect(ticketLinks(markup)).toEqual([]);
    expect(plain(markup)).toContain('Дат пока нет');
    expect(plain(markup)).toContain(SITE.phone);
    expect(markup).toContain(`href="${phoneHref(SITE.phone)}"`);
  });

  it('льготы события стоят на странице', () => {
    const text = plain(render());

    for (const perk of PERKS) {
      expect(text).toContain(perk);
    }
  });

  it('адрес кассы с параметрами доходит до кнопки без изменений', () => {
    const url = `${TICKET_URL}&utm_source=kaup39&utm_medium=event`;
    const links = ticketLinks(
      render({
        event: { ...EVENT, ticketUrl: url },
        dates: DATES.map((item) => ({ ...item, event: { ...item.event, ticketUrl: url } })),
      }),
    );

    expect(links.length).toBeGreaterThanOrEqual(2);

    for (const { rawHref, href } of links) {
      expect(rawHref).toContain('?openAsLinkKey=97088c52oc&amp;utm_source=kaup39&amp;utm_medium=event');
      expect(href).toBe(url);
    }
  });

  it('строка над заголовком — «событие · 12+» с возрастом и «событие» без точки-разделителя, когда возраста нет', () => {
    expect(kindOf(render({ event: { ...EVENT, ageRating: '12+' } }))).toBe('событие · 12+');
    expect(kindOf(render({ event: { ...EVENT, ageRating: '' } }))).toBe('событие');
    expect(kindOf(render({ event: { ...EVENT, ageRating: null } }))).toBe('событие');
  });

  it('все даты прошли — первый экран «дат пока нет» с днем последней даты, панель цены — «цены прошлого сезона»', () => {
    const markup = render({ now: new Date('2026-10-25T12:00:00Z') });
    const firstScreen = plain(firstScreenOf(markup));

    expect(firstScreen).toContain('дат пока нет');
    expect(firstScreen).toContain('прошло 24 октября');
    expect(firstScreenOf(markup)).toContain('dateTime="2026-10-24"');
    expect(plain(markup)).toContain('цены прошлого сезона');
  });

  it('возврат — таблица сроков, письмо в кассу и что указать; без сроков, почты и текста правил раздела нет', () => {
    const refund = refundOf(render());
    const text = plain(refund);

    expect(refund).toContain('<table');

    for (const { when, share } of TERMS) {
      expect(text).toContain(when);
      expect(text).toContain(share);
    }

    expect(refund).toContain('href="mailto:support@radario.ru"');

    for (const { text: detail } of SITE.refund!.details!) {
      expect(text).toContain(detail);
    }

    const bare = render({ site: { ...SITE, refund: { title: 'Возврат билетов', details: SITE.refund!.details } } });

    expect(refundOf(bare)).toBe('');
    expect(plain(bare)).not.toContain('Возврат билета');
  });

  it('кадр первого экрана — поле события `hero`, нет его — кадр карточки `photo`', () => {
    const hero = photo(21, 'drakkar-hero.jpg', 'Драккар у причала на закате');
    const card = photo(22, 'kartochka.jpg', 'Строй викингов');

    const withHero = firstScreenOf(render({ event: { ...EVENT, hero, photo: card } as Event }));

    expect(withHero).toContain('drakkar-hero.jpg');
    expect(withHero).not.toContain('kartochka.jpg');

    const withoutHero = firstScreenOf(render({ event: { ...EVENT, hero: null, photo: card } as Event }));

    expect(withoutHero).toContain('kartochka.jpg');
  });
});
