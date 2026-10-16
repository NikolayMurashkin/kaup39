import { readFileSync, statSync } from 'node:fs';
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CorporateContent } from '@/app/(site)/korporativy/CorporateContent';
import { Reviews } from '@/app/(site)/korporativy/CorporateContent/Reviews';
import { CORPORATE_PARTS } from '@/app/(site)/korporativy/consts';
import { corporateParts, rentNote, rentPrices as rentPricesOf } from '@/app/(site)/korporativy/parts';
import PolicyPage from '@/app/(site)/politika/page';
import { LeadForm, LeadSent } from '@/components/LeadForm';
import { SiteFooter } from '@/components/SiteFooter';
import { POLICY_PATH } from '@/lib/consts';
import { formatAmount, phoneHref } from '@/lib/format';
import { HONEYPOT_FIELD } from '@/lib/lead/consts';
import type { Media, Page } from '@/payload-types';
import { CORPORATE } from '../e2e/seed/data';
import { sourceFiles } from '../lib/files';
import { SITE } from '../lib/site';

type Sections = NonNullable<Page['sections']>;
type Section = Sections[number];
type Review = Parameters<typeof CorporateContent>[0]['reviews'][number];

/** Проверочная страница: тексты придуманы для теста, это не контент владельцев. */
const STAMP = '2026-10-16T00:00:00.000Z';

const photo = (id: number, file: string, alt: string): Media => ({
  id,
  alt,
  caption: null,
  author: null,
  temporary: false,
  url: `/api/media/file/${file}`,
  filename: file,
  width: 1600,
  height: 1000,
  updatedAt: STAMP,
  createdAt: STAMP,
});

const PHOTOS = [
  photo(41, 'korporativ-1.jpg', 'Проверочный стол в длинном доме'),
  photo(42, 'korporativ-2.jpg', 'Проверочное огненное шоу'),
  photo(43, 'korporativ-3.jpg', 'Проверочные гости у костра'),
];

const RENT_AMOUNT = 5000;

const NEW_YEAR: Section = {
  id: 'k1',
  blockType: 'text',
  anchor: 'new-year',
  heading: 'Проверочный Новый год',
  body: 'Проверочный текст про новогодний праздник.',
};

const CAPACITY: Section = {
  id: 'k2',
  blockType: 'list',
  anchor: 'capacity',
  heading: 'Проверочная вместимость',
  items: [{ id: 'c1', title: '270 кв. м', text: 'площадь проверочного дома' }],
};

const FORMATS: Section = {
  id: 'k3',
  blockType: 'list',
  anchor: 'formats',
  heading: 'Проверочные форматы',
  items: [
    { id: 'f1', title: 'Проверочный корпоратив' },
    { id: 'f2', title: 'Проверочная свадьба' },
  ],
};

const LONGHOUSE: Section = {
  id: 'k4',
  blockType: 'text',
  anchor: 'longhouse',
  heading: 'Проверочный длинный дом',
  body: 'Проверочный текст про длинный дом.',
};

const FIRE_SHOW: Section = {
  id: 'k5',
  blockType: 'list',
  anchor: 'fire-show',
  heading: 'Проверочное огненное шоу',
  items: [{ id: 's1', title: 'Проверочный номер с огнем' }],
};

const FOOD: Section = {
  id: 'k6',
  blockType: 'list',
  anchor: 'food',
  heading: 'Проверочное угощение',
  items: [{ id: 'd1', title: 'Проверочный кейтеринг' }],
};

const RENT: Section = {
  id: 'k7',
  blockType: 'text',
  anchor: 'rent',
  heading: 'Проверочная аренда поселения',
  body: 'Проверочный текст про аренду поселения целиком.',
};

const rentPrices = (amount: number): Section => ({
  id: 'k8',
  blockType: 'prices',
  anchor: 'rent-prices',
  heading: 'Проверочная стоимость аренды',
  rows: [{ id: 'r1', label: 'Аренда поселения', amount, unit: 'час' }],
});

const RENT_PRICES = rentPrices(RENT_AMOUNT);

const CORPORATE_PHOTOS: Section = {
  id: 'k9',
  blockType: 'photos',
  anchor: 'corporate-photos',
  heading: 'Проверочные фото мероприятий',
  photos: PHOTOS,
};

const REQUEST: Section = {
  id: 'k10',
  blockType: 'text',
  anchor: 'request',
  heading: 'Проверочная заявка',
  body: 'Проверочный текст рядом с формой.',
};

const SECTIONS: Sections = [
  NEW_YEAR,
  CAPACITY,
  FORMATS,
  LONGHOUSE,
  FIRE_SHOW,
  FOOD,
  RENT,
  RENT_PRICES,
  CORPORATE_PHOTOS,
  REQUEST,
];

/** Якорь и тип блока каждого раздела, который страница рисует своей частью. */
const PART_SPECS = SECTIONS.map(({ anchor, blockType }) => ({ anchor, blockType }));

const PAGE: Page = {
  id: 4,
  slug: 'corporate',
  title: 'Проверочные корпоративы',
  sections: SECTIONS,
  updatedAt: STAMP,
  createdAt: STAMP,
};

const REVIEW: Review = {
  id: 1,
  author: 'Проверочный гость',
  text: 'Проверочный текст о празднике в длинном доме.',
  occasion: 'Проверочный корпоратив',
  updatedAt: STAMP,
  createdAt: STAMP,
};

const DEFAULT_TITLE = 'Корпоративы и свадьбы';

const SITE_HREF = phoneHref(SITE.phone);

/** Строки служебного мусора исходной страницы и выдуманных отзывов, которым на странице не место. */
const FORBIDDEN: [string, RegExp][] = [
  ['Unsplash', /unsplash/i],
  ['(текущий год)', /\(текущий год\)/],
  ['Елена Смирнова', /Елена Смирнова/],
  ['Александр Иванов', /Александр Иванов/],
  ['Мария Петрова', /Мария Петрова/],
  ['третий телефон', /9062[\s()-]*37[\s()-]*99[\s()-]*26/],
];

/** Файлы страницы корпоративов, политики, формы, обработчика и чтения данных. */
const PAGE_FILES =
  /^(?:app\/\(site\)\/korporativy\/|app\/\(site\)\/politika\/|components\/LeadForm\/|app\/api\/lead\/|lib\/lead\/|cms\/corporate\.ts$)/;

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

const draw = (element: ReactElement) =>
  renderToStaticMarkup(<AppRouterContext.Provider value={ROUTER}>{element}</AppRouterContext.Provider>);

const render = (page: Page | null = PAGE, reviews: Review[] = []) =>
  draw(
    <CorporateContent
      page={page}
      site={SITE}
      reviews={reviews}
    />,
  );

/** Текст без разметки: неразрывные пробелы и сущности — обычными знаками. */
const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;| /g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

/** Элемент от открывающего тега до закрывающего с учетом вложенных тегов того же имени. */
const elementFrom = (markup: string, open: RegExpExecArray | null) => {
  if (!open) return null;

  const tag = open[1];
  const tags = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g');

  tags.lastIndex = open.index + open[0].length;

  let depth = 1;

  for (let match = tags.exec(markup); match; match = tags.exec(markup)) {
    if (match[0].endsWith('/>')) continue;

    depth += match[1] ? -1 : 1;

    if (depth === 0) return markup.slice(open.index, tags.lastIndex);
  }

  return null;
};

/** Все элементы, чей открывающий тег подходит под `pattern` (первая группа — имя тега). */
const elementsMatching = (markup: string, pattern: RegExp) =>
  [...markup.matchAll(new RegExp(pattern.source, 'g'))]
    .map((open) => elementFrom(markup, open as RegExpExecArray))
    .filter((html): html is string => html !== null);

const headingsOf = (markup: string) =>
  [...markup.matchAll(/<h1\b[^>]*>((?:(?!<\/h1>)[\s\S])*)<\/h1>/g)].map(([, html]) => plain(html));

/** Тексты ссылок с данным `href`. */
const linksTo = (markup: string, href: string) =>
  [...markup.matchAll(/<a\b([^>]*)>((?:(?!<\/a>)[\s\S])*)<\/a>/g)]
    .filter(([, attributes]) => attributes.includes(` href="${href}"`))
    .map(([, , body]) => plain(body));

/** Кнопки целиком: открывающий тег и содержимое. */
const buttonsOf = (markup: string) =>
  [...markup.matchAll(/<button\b([^>]*)>((?:(?!<\/button>)[\s\S])*)<\/button>/g)].map(([, attributes, body]) => ({
    attributes,
    body,
  }));

const inputsOf = (markup: string) => markup.match(/<input\b[^>]*>/g) ?? [];

/** Сумма со знаком рубля, перед которой нет другой цифры: «5000 ₽» не находится внутри «15000 ₽». */
const amountPattern = (amount: number) => new RegExp(`(?<!\\d)${formatAmount(amount).replace(/ /g, ' ')} ₽`);

const lower = (markup: string) => plain(markup).toLowerCase();

describe('отзывы на странице корпоративов', () => {
  it('Reviews: пустой список — пустая строка; один отзыв — section#reviews с автором и текстом', () => {
    expect(draw(<Reviews reviews={[]} />)).toBe('');

    const markup = draw(<Reviews reviews={[REVIEW]} />);

    expect(markup).toMatch(/^<section\b[^>]*\bid="reviews"/);
    expect(plain(markup)).toContain(REVIEW.author);
    expect(plain(markup)).toContain(REVIEW.text);
  });

  it('страница без отзывов — секции отзывов нет; с одним отзывом — есть', () => {
    const empty = render(PAGE, []);

    expect(headingsOf(empty), 'страница отрисована').toEqual([PAGE.title]);
    expect(empty).not.toContain('id="reviews"');
    expect(plain(empty)).not.toContain('Отзывы');

    const withReview = render(PAGE, [REVIEW]);

    expect(withReview).toContain('id="reviews"');
    expect(plain(withReview)).toContain(REVIEW.author);
    expect(plain(withReview)).toContain(REVIEW.text);
  });
});

describe('страница корпоративов', () => {
  it('разделы по частям: часть — первый раздел со своим якорем и типом; чужой якорь, чужой тип, повтор — в rest; нет раздела — нет части', () => {
    const specs = Object.values(CORPORATE_PARTS).map(({ anchor, blockType }) => ({ anchor, blockType }));
    const sortSpecs = (list: { anchor?: string | null; blockType: string }[]) =>
      [...list].sort((one, two) => `${one.anchor}/${one.blockType}`.localeCompare(`${two.anchor}/${two.blockType}`));

    expect(sortSpecs(specs)).toEqual(sortSpecs(PART_SPECS));

    const keyOf = (anchor: string) =>
      Object.entries(CORPORATE_PARTS).find(([, spec]) => spec.anchor === anchor)?.[0] ?? `нет части ${anchor}`;
    const parts = corporateParts(SECTIONS) as unknown as Record<string, unknown>;

    for (const section of SECTIONS) {
      expect(parts[keyOf(section.anchor!)], section.anchor!).toEqual(section);
    }

    expect(parts.rest).toEqual([]);

    const foreignAnchor: Section = { id: 'x1', blockType: 'text', anchor: 'proverka-chuzhoi', heading: 'Чужой раздел' };
    const foreignType: Section = {
      id: 'x2',
      blockType: 'text',
      anchor: 'rent-prices',
      heading: 'Цены текстом',
      body: 'Аренда — проверочная сумма.',
    };
    const repeated: Section = { ...RENT_PRICES, id: 'x3', heading: 'Еще цены' };
    const mixed = corporateParts([foreignType, ...SECTIONS, foreignAnchor, repeated]) as unknown as Record<
      string,
      unknown
    >;

    expect(mixed[keyOf('rent-prices')]).toEqual(RENT_PRICES);
    expect(mixed.rest).toEqual([foreignType, foreignAnchor, repeated]);

    const partial = corporateParts(SECTIONS.filter((section) => section.anchor !== 'food')) as unknown as Record<
      string,
      unknown
    >;

    expect(partial[keyOf('food')]).toBeNull();
    expect(partial[keyOf('formats')]).toEqual(FORMATS);
  });

  it('заголовок, аренда с ценой за час из строки цен, кадры мероприятий — кнопки просмотра; без страницы — заголовок по умолчанию, форма и телефон владельцев', () => {
    const markup = render();
    const text = plain(markup);

    expect(headingsOf(markup)).toEqual([PAGE.title]);
    expect(text).toMatch(amountPattern(RENT_AMOUNT));
    expect(text).toContain('в час');

    const changed = plain(
      render({ ...PAGE, sections: SECTIONS.map((s) => (s === RENT_PRICES ? rentPrices(7000) : s)) }),
    );

    expect(changed).toMatch(amountPattern(7000));
    expect(changed).not.toMatch(amountPattern(RENT_AMOUNT));

    const viewers = buttonsOf(markup).filter(({ attributes }) => attributes.includes('aria-haspopup="dialog"'));

    for (const { filename } of PHOTOS) {
      expect(
        viewers.some(({ body }) => body.includes(filename!)),
        `кадр ${filename} — кнопка просмотра`,
      ).toBe(true);
    }

    const empty = render(null);

    expect(headingsOf(empty)).toEqual([DEFAULT_TITLE]);
    expect(empty).toMatch(/<form\b/);
    expect(linksTo(empty, SITE_HREF)).toEqual(expect.arrayContaining([expect.stringContaining(SITE.phone)]));
  });

  it('форма: отправка неактивна без согласия, согласие обязательно и ведет на политику, ловушка скрыта, рядом — пометка демо и телефон владельцев', () => {
    const markup = draw(<LeadForm phone={SITE.phone} />);

    const submit = buttonsOf(markup).filter(({ body }) => plain(body).includes('Отправить заявку'));

    expect(submit, 'кнопка «Отправить заявку»').toHaveLength(1);
    expect(submit[0].attributes).toMatch(/\bdisabled=""/);

    const checkboxes = inputsOf(markup).filter((tag) => tag.includes('type="checkbox"'));

    expect(
      checkboxes.some((tag) => tag.includes('required=""')),
      'чекбокс согласия required',
    ).toBe(true);
    expect(
      checkboxes.some((tag) => tag.includes('checked=""')),
      'согласие не отмечено заранее',
    ).toBe(false);
    expect(markup).toContain(`href="${POLICY_PATH}"`);

    const trap = inputsOf(markup).filter((tag) => tag.includes(`name="${HONEYPOT_FIELD}"`));

    expect(trap, 'поле-ловушка').toHaveLength(1);
    expect(trap[0]).toContain('tabindex="-1"');
    // имя атрибута в HTML без учета регистра: React пишет его как `autoComplete`
    expect(trap[0]).toMatch(/autocomplete="off"/i);

    const hiddenWrappers = elementsMatching(markup, /<([a-z0-9]+)\b[^>]*\baria-hidden="true"[^>]*>/);

    expect(
      trap[0].includes('aria-hidden="true"') || hiddenWrappers.some((html) => html.includes(trap[0])),
      'ловушка скрыта от экранного чтения',
    ).toBe(true);

    const text = lower(markup);

    expect(text).toContain('демо-версия');
    expect(text).toContain('студии mrshkn');
    expect(text).toContain('не поселению');
    expect(linksTo(markup, SITE_HREF)).toEqual(expect.arrayContaining([expect.stringContaining(SITE.phone)]));
  });

  it('сообщение об успехе: демо-версия, заявка пришла студии MRSHKN, поселению не передается, телефон владельцев', () => {
    const markup = draw(<LeadSent phone={SITE.phone} />);
    const text = lower(markup);

    expect(text).toContain('демо-версия');
    expect(text).toContain('студии mrshkn');
    expect(text).toContain('поселению заявка не передается');
    expect(linksTo(markup, SITE_HREF)).toEqual(expect.arrayContaining([expect.stringContaining(SITE.phone)]));
  });

  it('политика ПД: оператор — студия MRSHKN, каналы Telegram и почта, отзыв согласия — hello@mrshkn.com', async () => {
    // страница может быть и обычной, и асинхронной функцией: результат ждется в обоих случаях
    const page: unknown = await PolicyPage();
    const markup = draw(page as ReactElement);
    const text = plain(markup);
    const blocks = elementsMatching(markup, /<(p|li)\b[^>]*>/).map(plain);

    expect(text).toContain('студия MRSHKN');
    expect(text).toContain('Telegram');
    expect(text).toMatch(/почт|письм/i);
    expect(
      blocks.some((block) => block.includes('hello@mrshkn.com') && /отозва|отзыв/i.test(block)),
      'абзац с адресом для отзыва согласия',
    ).toBe(true);
  });
});

describe('контент страницы корпоративов', () => {
  it('ни в файлах страницы, ни в засеве, ни в отрисовке с подвалом нет служебного мусора, выдуманных отзывов и третьего телефона', () => {
    const files = sourceFiles(PAGE_FILES).filter((file) => statSync(file).isFile());
    const pageFiles = files.filter((file) => file.includes('/korporativy/'));

    expect(pageFiles.length, 'файлов страницы корпоративов').toBeGreaterThanOrEqual(1);

    const rendered = draw(
      <>
        <CorporateContent
          page={PAGE}
          site={SITE}
          reviews={[]}
        />
        <SiteFooter site={SITE} />
      </>,
    );

    expect(headingsOf(rendered), 'отрисовка страницы с подвалом').toEqual([PAGE.title]);

    const sources: [string, string][] = [
      ...files.map((file): [string, string] => [file, readFileSync(file, 'utf8')]),
      ['засев CORPORATE', JSON.stringify(CORPORATE)],
      ['отрисовка с подвалом', plain(rendered)],
    ];

    for (const [name, content] of sources) {
      for (const [label, pattern] of FORBIDDEN) {
        expect(content, `${name}: ${label}`).not.toMatch(pattern);
      }
    }
  });
});

describe('цены аренды: подпись после «в час»', () => {
  const pricesOf = (rows: { label: string; amount: number; unit?: string | null }[]) =>
    ({
      id: 'p1',
      blockType: 'prices',
      anchor: 'rent-prices',
      rows: rows.map((row, index) => ({ id: `r${index}`, ...row })),
    }) as Extract<Section, { blockType: 'prices' }>;

  it('подпись строки идет со строчной, аббревиатура остается, единица без пробелов по краям', () => {
    const [plainRow, abbreviation, noUnit] = rentPricesOf(
      pricesOf([
        { label: 'Аренда поселения', amount: 15000, unit: '  час ' },
        { label: 'VIP-зал', amount: 3000, unit: 'час' },
        { label: 'Длинный дом', amount: 2000, unit: '   ' },
      ]),
    );

    expect(plainRow).toEqual({ label: 'Аренда поселения', amount: formatAmount(15000), unit: 'час' });
    expect(rentNote(plainRow)).toBe('в час, аренда поселения');
    expect(rentNote(abbreviation)).toBe('в час, VIP-зал');
    expect(noUnit.unit).toBeNull();
    expect(rentNote(noUnit)).toBe('длинный дом');
  });
});
