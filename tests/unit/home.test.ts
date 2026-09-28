import { describe, expect, it } from 'vitest';
import { eventCards, firstScreen, mosaicLayout, tavernSummary, teaserCards } from '@/app/(site)/_home/cards';
import type { ScheduleItem } from '@/cms/types';
import type { Event, Media, Page, Tavern } from '@/payload-types';

const NBSP = ' ';

const media = (id: number): Media => ({
  id,
  alt: `Кадр ${id}`,
  caption: null,
  temporary: false,
  url: `/api/media/file/kadr-${id}.jpg`,
  width: 1600,
  height: 1000,
  updatedAt: '2026-09-28T00:00:00.000Z',
  createdAt: '2026-09-28T00:00:00.000Z',
});

const DAY_EVENT = { slug: 'denvikingi', title: 'День с викингами', ticketUrl: 'https://radario.ru/den' };
const EVENING_EVENT = { slug: 'ragnarek', title: 'Рагнарек', ticketUrl: 'https://radario.ru/ragnarek' };

const DAY_TARIFFS: ScheduleItem['tariffs'] = [{ kind: 'entry', amount: 700 }];
const EVENING_TARIFFS: ScheduleItem['tariffs'] = [
  { kind: 'adult', amount: 1000 },
  { kind: 'child', amount: 700 },
];

let nextId = 1;

const day = (date: string): ScheduleItem => ({
  id: nextId++,
  date,
  start: '13:00',
  end: '16:00',
  show: null,
  event: DAY_EVENT,
  tariffs: DAY_TARIFFS,
});

const evening = (date: string): ScheduleItem => ({
  id: nextId++,
  date,
  start: '16:00',
  end: '19:00',
  show: '18:30',
  event: EVENING_EVENT,
  tariffs: EVENING_TARIFFS,
});

const event = (
  { slug, title, ticketUrl }: typeof DAY_EVENT,
  tariffs: ScheduleItem['tariffs'],
  extra: Partial<Event> = {},
): Event => ({
  id: nextId++,
  slug,
  title,
  ticketUrl,
  tariffs,
  summary: `Коротко о событии «${title}»`,
  includes: ['Экскурсия', 'Драккар', 'Ярмарка', 'Квест'].map((text) => ({ text })),
  updatedAt: '2026-09-28T00:00:00.000Z',
  createdAt: '2026-09-28T00:00:00.000Z',
  ...extra,
});

const EVENTS = [event(EVENING_EVENT, EVENING_TARIFFS), event(DAY_EVENT, DAY_TARIFFS, { photo: media(7) })];

describe('карточки событий на главной', () => {
  it('у каждого события карточка с его ближайшей датой; карточки — от ближайшей даты, дальше «еще N дат до …»', () => {
    const upcoming = [day('2026-10-03'), evening('2026-10-10'), day('2026-10-17'), day('2026-10-24')];

    const cards = eventCards(EVENTS, upcoming, '2026-10-24');

    expect(cards.map((card) => card.slug)).toEqual(['denvikingi', 'ragnarek']);
    expect(cards[0]).toMatchObject({
      href: '/sobytiya/denvikingi',
      title: 'День с викингами',
      summary: 'Коротко о событии «День с викингами»',
      facts: ['Экскурсия', 'Драккар', 'Ярмарка'],
      photo: { src: '/api/media/file/kadr-7.jpg' },
      ticketUrl: 'https://radario.ru/den',
      price: { value: '700', note: 'входной билет' },
      dates: {
        kind: 'dated',
        next: { dateTime: '2026-10-03', date: '3 октября, суббота', time: '13:00 — 16:00' },
        later: { count: 2, dateTime: '2026-10-24', date: '24 октября' },
      },
    });
    expect(cards[1]).toMatchObject({
      photo: null,
      price: { value: '700', prefix: 'от', note: 'детский билет' },
      dates: {
        kind: 'dated',
        next: { dateTime: '2026-10-10', date: '10 октября, суббота', time: '16:00 — 19:00, шоу 18:30' },
        later: null,
      },
    });
  });

  it('событие без будущих дат при открытом сезоне остается карточкой без даты и кассы — после событий с датами', () => {
    const cards = eventCards(EVENTS, [day('2026-10-03')], '2026-10-24');

    expect(cards.map((card) => [card.slug, card.dates.kind])).toEqual([
      ['denvikingi', 'dated'],
      ['ragnarek', 'waiting'],
    ]);
  });

  it('сезон закрыт (D27): у всех событий «дат пока нет», последняя дата сезона и цены прошлого сезона', () => {
    const cards = eventCards(EVENTS, [], '2026-10-24');

    expect(cards).toHaveLength(2);

    for (const card of cards) {
      expect(card.dates).toEqual({ kind: 'closed', year: 2026, last: { dateTime: '2026-10-24', date: '24 октября' } });
      expect(card.price.note).toBe('цены прошлого сезона');
    }

    expect(eventCards(EVENTS, [], null)[0].dates).toEqual({ kind: 'closed', year: null, last: null });
  });
});

describe('первый экран главной', () => {
  it('ближайшая дата: день, день недели со временем и событием, самая низкая цена и касса этой даты', () => {
    expect(firstScreen([evening('2026-10-10'), day('2026-10-17')], '2026-10-24')).toEqual({
      next: {
        dateTime: '2026-10-10',
        date: '10 октября',
        details: 'суббота, 16:00 — 19:00, шоу 18:30 · Рагнарек',
        price: 700,
        ticketUrl: 'https://radario.ru/ragnarek',
      },
    });
  });

  it('сезон закрыт (D27): вместо ближайшей даты — год сезона и день последнего события', () => {
    expect(firstScreen([], '2026-10-24')).toEqual({
      next: null,
      seasonClosed: { label: 'сезон 2026 закрыт', last: { dateTime: '2026-10-24', date: '24 октября' } },
    });
    expect(firstScreen([], null)).toEqual({ next: null, seasonClosed: { label: 'сезон закрыт', last: null } });
  });
});

const page = (slug: Page['slug'], extra: Partial<Page> = {}): Page => ({
  id: nextId++,
  slug,
  title: `Страница ${slug}`,
  lead: `Подзаголовок ${slug}`,
  updatedAt: '2026-09-28T00:00:00.000Z',
  createdAt: '2026-09-28T00:00:00.000Z',
  ...extra,
});

describe('тизеры страниц вместо разделов', () => {
  it('три тизера по порядку артборда ведут на отдельные страницы: «как доехать», кемпинг, корпоративы', () => {
    const pages = [
      page('corporate', { teaser: { title: 'Поселение целиком', text: 'Длинный дом', action: 'Форматы и заявка' } }),
      page('home'),
      page('camping', { teaser: { title: 'Ночь в поселении', photo: media(3) } }),
      page('directions', { teaser: { title: '4 км от поселка', text: 'Трансфер', action: 'Маршрут' } }),
    ];

    expect(teaserCards(pages)).toEqual([
      {
        slug: 'directions',
        href: '/kak-doehat',
        label: 'как доехать',
        title: '4 км от поселка',
        text: 'Трансфер',
        action: 'Маршрут',
        photo: null,
      },
      {
        slug: 'camping',
        href: '/kemping',
        label: 'кемпинг',
        title: 'Ночь в поселении',
        text: 'Подзаголовок camping',
        action: 'Подробнее',
        photo: expect.objectContaining({ src: '/api/media/file/kadr-3.jpg' }),
      },
      {
        slug: 'corporate',
        href: '/korporativy',
        label: 'корпоративы, свадьбы, аренда',
        title: 'Поселение целиком',
        text: 'Длинный дом',
        action: 'Форматы и заявка',
        photo: null,
      },
    ]);
  });

  it('страница без тизера в CMS берет заголовок и подзаголовок; страницы, которой нет, нет и в тизерах', () => {
    expect(teaserCards([page('directions')])).toEqual([
      expect.objectContaining({ href: '/kak-doehat', title: 'Страница directions', text: 'Подзаголовок directions' }),
    ]);
  });
});

/** Клетки, которые занимает кадр мозаики по своему классу; `full` — вся строка. */
const SPANS = { big: [2, 2], tall: [1, 2], wide: [2, 1], full: [Infinity, 1], '': [1, 1] } as const;

/**
 * Раскладка `grid-auto-flow: dense`: каждый кадр встает в первое место сверху-слева, где он помещается.
 * Возвращает строки сетки: `true` — клетка занята.
 */
const denseGrid = (layout: (keyof typeof SPANS)[], columns: number) => {
  const rows: boolean[][] = [];
  const free = (row: number, column: number) => !rows[row]?.[column];

  for (const size of layout) {
    const width = Math.min(SPANS[size][0], columns);
    const height = SPANS[size][1];

    for (let row = 0, placed = false; !placed; row++) {
      for (let column = 0; column + width <= columns && !placed; column++) {
        const cells = Array.from({ length: height }, (_, dy) =>
          Array.from({ length: width }, (__, dx) => [row + dy, column + dx]),
        ).flat();

        if (cells.every(([y, x]) => free(y, x))) {
          for (const [y, x] of cells) {
            rows[y] ??= Array<boolean>(columns).fill(false);
            rows[y][x] = true;
          }
          placed = true;
        }
      }
    }
  }

  return rows;
};

describe('мозаика галереи', () => {
  it.each(Array.from({ length: 13 }, (_, index) => index + 1))(
    '%i кадров: на 4 и на 2 колонках сетка без пустых клеток',
    (count) => {
      const layout = mosaicLayout(count);

      expect(layout).toHaveLength(count);

      for (const columns of [4, 2]) {
        const rows = denseGrid(layout, columns);

        expect(rows.flatMap((row, y) => row.map((taken, x) => (taken ? null : `${y}:${x}`)).filter(Boolean))).toEqual(
          [],
        );
      }
    },
  );

  it('шесть кадров — раскладка артборда: большой, высокий, два обычных, два широких', () => {
    expect(mosaicLayout(6)).toEqual(['big', 'tall', '', '', 'wide', 'wide']);
  });
});

const tavern = (menu: Tavern['menu']): Tavern => ({
  id: nextId++,
  name: 'Таверна',
  slug: 'taverna',
  order: 1,
  menu,
  updatedAt: '2026-09-28T00:00:00.000Z',
  createdAt: '2026-09-28T00:00:00.000Z',
});

describe('строка таверны', () => {
  it('у таверны с меню — число позиций и самая низкая цена, без меню — строки нет', () => {
    expect(
      tavernSummary(
        tavern([
          {
            items: [
              { name: 'Похлебка', price: 350 },
              { name: 'Лепешка', price: 150, priceTo: 250 },
            ],
          },
          { title: 'Напитки', items: [{ name: 'Чай', price: 50 }] },
        ]),
      ),
    ).toBe(`3${NBSP}позиции, от${NBSP}50${NBSP}₽`);
    expect(tavernSummary(tavern([{ items: [{ name: 'Каша', price: 1200 }] }]))).toBe(
      `1${NBSP}позиция, от${NBSP}1200${NBSP}₽`,
    );
    expect(tavernSummary(tavern(null))).toBeNull();
    expect(tavernSummary(tavern([]))).toBeNull();
  });
});
