import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CampingContent } from '@/app/(site)/kemping/CampingContent';
import { campingFacts, campingParts, type CampingParts } from '@/app/(site)/kemping/parts';
import { validatePhone } from '@/cms/validate';
import { CmsSections } from '@/components/CmsSections';
import { formatAmount, phoneHref } from '@/lib/format';
import type { Media, Page, Site } from '@/payload-types';

type Sections = NonNullable<Page['sections']>;
type Section = Sections[number];

const STAMP = '2026-10-15T00:00:00.000Z';

/** Описание кемпинга из файла контента — первый абзац, без фразы с номером телефона. */
const DESCRIPTION =
  'На территории нашей деревни можно остановиться на ночь, отдохнуть на природе с палатками в компании друзей и близких, погрузиться в атмосферу средневековья, насладиться вечерней фестивальной программой, огненным шоу и потрясающим звездным небом над головой.';

const PRICE_ROWS = [
  { id: 'p1', label: 'До 5 человек', amount: 2000, note: '1 место под палатку и машину' },
  { id: 'p2', label: '1 человек', amount: 800, note: '1 место под палатку' },
  { id: 'p3', label: 'Доплата за каждого дополнительного человека в палатке', amount: 300 },
];

const SERVICES = [
  { id: 's1', title: 'Дрова', text: 'Одна связка бесплатно' },
  { id: 's2', title: 'Туалет' },
  { id: 's3', title: 'Техническая вода' },
  { id: 's4', title: 'Умывальник' },
  { id: 's5', title: 'Душевые кабинки' },
  { id: 's6', title: 'Охрана днем и ночью', text: 'ЧОП' },
];

const photo = (id: number, file: string, alt: string, author: string | null = null): Media => ({
  id,
  alt,
  caption: null,
  author,
  temporary: false,
  url: `/api/media/file/${file}`,
  filename: file,
  width: 1600,
  height: 1000,
  updatedAt: STAMP,
  createdAt: STAMP,
});

/** Автор у первого кадра: просмотр открывается с первого кадра, подпись автора видна в разметке. */
const AUTHOR = 'Проверочный фотограф';

const PHOTOS = [
  photo(31, 'kemping-1.jpg', 'Палатки на поляне у частокола', AUTHOR),
  photo(32, 'kemping-2.jpg', 'Костер у палаток вечером'),
  photo(33, 'kemping-3.jpg', 'Поляна кемпинга утром'),
];

const HERO = photo(30, 'kemping-hero.jpg', 'Палатки кемпинга под звездным небом');

const DESCRIPTION_SECTION: Section = {
  id: 'c1',
  blockType: 'text',
  anchor: 'camping',
  heading: 'Кемпинг на Каупе',
  body: DESCRIPTION,
};

const PRICES_SECTION: Section = {
  id: 'c2',
  blockType: 'prices',
  anchor: 'camping-prices',
  heading: 'Аренда места 5 на 5 метров',
  rows: PRICE_ROWS,
};

const SERVICES_SECTION: Section = {
  id: 'c3',
  blockType: 'list',
  anchor: 'camping-services',
  heading: 'Услуги в кемпинге',
  items: SERVICES,
};

const PHOTOS_SECTION: Section = {
  id: 'c4',
  blockType: 'photos',
  anchor: 'camping-photos',
  heading: 'Фото кемпинга',
  photos: PHOTOS,
};

const BOOKING = {
  heading: 'Бронирование',
  intro: 'Подробности и бронирование по телефону',
  phone: '8 906 213-44-55',
  person: 'Анастасия',
};

/** Раздел «Телефон»: тип раздела берется из схемы CMS, литерал приводится к нему. */
const BOOKING_SECTION = {
  id: 'c5',
  blockType: 'phone',
  anchor: 'camping-booking',
  ...BOOKING,
} as unknown as Section;

const SECTIONS: Sections = [DESCRIPTION_SECTION, PRICES_SECTION, SERVICES_SECTION, PHOTOS_SECTION, BOOKING_SECTION];

const PAGE: Page = {
  id: 3,
  slug: 'camping',
  title: 'Кемпинг на Каупе',
  hero: { photoNight: HERO, photoDay: HERO },
  sections: SECTIONS,
  updatedAt: STAMP,
  createdAt: STAMP,
};

/** Общий телефон владельцев: панель бронирования берет его, когда раздела «Телефон» нет. */
const SITE: Site = {
  id: 1,
  name: 'Поселение эпохи викингов «Кауп»',
  address: 'Калининградская область, Зеленоградский район, 4 км от п. Романово',
  phone: '8 (4012) 37-99-26',
  email: 'test@example.com',
};

const BOOKING_HREF = 'tel:+79062134455';
const SITE_HREF = 'tel:+74012379926';

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

const render = (page: Page | null = PAGE, site: Site = SITE) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={ROUTER}>
      <CampingContent
        page={page}
        site={site}
      />
    </AppRouterContext.Provider>,
  );

const withSections = (sections: Sections): Page => ({ ...PAGE, sections });

const without = (...anchors: string[]) => SECTIONS.filter((section) => !anchors.includes(section.anchor ?? ''));

/** Текст без разметки: неразрывные пробелы и сущности — обычными знаками. */
const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
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
    depth += match[1] ? -1 : 1;

    if (depth === 0) return { start: open.index, end: tags.lastIndex, html: markup.slice(open.index, tags.lastIndex) };
  }

  return null;
};

/** Элемент с `id`: якорь раздела CMS. */
const inside = (markup: string, id: string) => {
  const element = elementFrom(markup, new RegExp(`<([a-z0-9]+)\\b[^>]*\\bid="${id}"[^>]*>`).exec(markup));

  expect(element, `в разметке нет элемента #${id}`).not.toBeNull();

  return element!.html;
};

/** Шапка страницы — первый `<header>` содержимого. */
const headOf = (markup: string) => {
  const element = elementFrom(markup, /<(header)\b[^>]*>/.exec(markup));

  expect(element, 'в разметке нет шапки страницы <header>').not.toBeNull();

  return element!;
};

/** Разметка после шапки: разделы страницы без строки фактов. */
const bodyOf = (markup: string) => markup.slice(headOf(markup).end);

const headingsOf = (markup: string) =>
  [...markup.matchAll(/<h1\b[^>]*>((?:(?!<\/h1>)[\s\S])*)<\/h1>/g)].map(([, html]) => plain(html));

/** Тексты ссылок с данным `href`. */
const linksTo = (markup: string, href: string) =>
  [...markup.matchAll(/<a\b([^>]*)>((?:(?!<\/a>)[\s\S])*)<\/a>/g)]
    .filter(([, attributes]) => attributes.includes(` href="${href}"`))
    .map(([, , body]) => plain(body));

const imagesOf = (markup: string) =>
  (markup.match(/<img\b[^>]*>/g) ?? []).map((tag) => ({
    src: decodeURIComponent((tag.match(/ src="([^"]*)"/)?.[1] ?? '').replace(/&amp;/g, '&')),
    alt: tag.match(/ alt="([^"]*)"/)?.[1] ?? '',
  }));

/** Сумма со знаком рубля, перед которой нет другой цифры: «800 ₽» не находится внутри «2800 ₽». */
const amountPattern = (amount: number) => new RegExp(`(?<!\\d)${formatAmount(amount)} ₽`);

describe('страница кемпинга', () => {
  it('блок «Телефон» в разделах — ссылка tel: на его номер, рядом кому звонить и подпись; общего телефона владельцев в содержимом нет', () => {
    const markup = render();

    expect(linksTo(markup, BOOKING_HREF)).toEqual(expect.arrayContaining([expect.stringContaining(BOOKING.phone)]));

    const booking = inside(markup, 'camping-booking');

    expect(booking).toContain(`href="${BOOKING_HREF}"`);
    expect(plain(booking)).toContain(BOOKING.person);
    expect(plain(booking)).toContain(BOOKING.intro);
    expect(markup).not.toContain(`href="${phoneHref(SITE.phone)}"`);
  });

  it('блока «Телефон» нет — панель бронирования ведет на общий телефон владельцев', () => {
    const markup = render(withSections(without('camping-booking')));

    expect(linksTo(markup, SITE_HREF)).toEqual(expect.arrayContaining([expect.stringContaining(SITE.phone)]));
    expect(markup).not.toContain(BOOKING_HREF);
  });

  it('цены: заголовок раздела и у каждой строки что, пояснение и сумма со знаком рубля', () => {
    const body = plain(bodyOf(render()));

    expect(body).toContain('Аренда места 5 на 5 метров');

    for (const { label, note, amount } of PRICE_ROWS) {
      expect(body, label).toContain(label);
      if (note) expect(body, note).toContain(note);
      expect(body, label).toMatch(amountPattern(amount));
    }
  });

  it('услуги: заголовок раздела, все шесть пунктов и пояснения у дров и охраны', () => {
    const text = plain(render());

    expect(text).toContain('Услуги в кемпинге');

    for (const { title } of SERVICES) {
      expect(text).toContain(title);
    }

    expect(text).toContain('Одна связка бесплатно');
    expect(text).toContain('ЧОП');
  });

  it('шапка: заголовок страницы из CMS и описание; без раздела описания — подзаголовок страницы; без страницы — «Кемпинг» и общий телефон', () => {
    const markup = render();

    expect(headingsOf(markup)).toEqual(['Кемпинг на Каупе']);
    expect(plain(markup)).toContain(DESCRIPTION);

    const lead = 'Проверочный подзаголовок: ночевка с палатками в поселении.';
    const withLead = render({ ...withSections(without('camping')), lead });

    expect(plain(headOf(withLead).html)).toContain(lead);

    const empty = render(null);

    expect(headingsOf(empty)).toEqual(['Кемпинг']);
    expect(linksTo(empty, SITE_HREF)).toEqual(expect.arrayContaining([expect.stringContaining(SITE.phone)]));
  });

  it('строка фактов в шапке — две первые строки цен', () => {
    expect(plain(headOf(render()).html)).toContain('До 5 человек — 2000 ₽, 1 человек — 800 ₽');
  });

  it('фото: заголовок раздела, три кадра с их описаниями и подпись автора; раздела нет — нет и заголовка', () => {
    const markup = render();
    const images = imagesOf(markup);

    expect(plain(markup)).toContain('Фото кемпинга');

    for (const { alt, filename } of PHOTOS) {
      expect(
        images.some((image) => image.src.includes(filename!)),
        filename!,
      ).toBe(true);
      // описание кадра — его alt или видимая подпись кадра-кнопки, рядом с которой картинка декоративная (alt="")
      expect(images.some((image) => image.alt === alt) || plain(markup).includes(alt), alt).toBe(true);
    }

    expect(plain(markup)).toContain(`Фото: ${AUTHOR}`);
    expect(plain(render(withSections(without('camping-photos'))))).not.toContain('Фото кемпинга');
  });

  it('кадр шапки — кадр страницы из CMS; кадра нет — страница рисуется без него', () => {
    expect(imagesOf(render()).some((image) => image.src.includes('kemping-hero'))).toBe(true);

    const bare = render({ ...PAGE, hero: {} });

    expect(headingsOf(bare)).toEqual(['Кемпинг на Каупе']);
    expect(bare).not.toContain('kemping-hero');
  });

  it('раздел с чужим якорем страница рисует среди прочих разделов', () => {
    const extra: Section = {
      id: 'x1',
      blockType: 'text',
      anchor: 'camping-extra',
      heading: 'Еще про ночевку',
      body: 'Проверочный текст прочего раздела.',
    };

    expect(plain(render(withSections([...SECTIONS, extra])))).toContain('Еще про ночевку');
  });

  it('разделы по частям: часть — первый раздел с ее якорем и типом блока, чужой тип и повтор якоря — в rest по порядку CMS', () => {
    const parts = campingParts(SECTIONS);

    expect(parts).toEqual({
      description: DESCRIPTION_SECTION,
      prices: PRICES_SECTION,
      services: SERVICES_SECTION,
      photos: PHOTOS_SECTION,
      booking: BOOKING_SECTION,
      rest: [],
    });

    const listAsPrices: Section = {
      id: 'w1',
      blockType: 'list',
      anchor: 'camping-prices',
      heading: 'Цены списком',
      items: [{ title: 'Место — 2000 ₽' }],
    };
    const secondPrices: Section = {
      id: 'w2',
      blockType: 'prices',
      anchor: 'camping-prices',
      heading: 'Еще цены',
      rows: [{ label: 'Дрова сверх связки', amount: 500 }],
    };
    const mixed = campingParts([listAsPrices, ...SECTIONS.slice(0, 2), secondPrices, ...SECTIONS.slice(2)]);

    expect(mixed.prices).toEqual(PRICES_SECTION);
    expect(mixed.rest).toEqual([listAsPrices, secondPrices]);

    const none = { description: null, prices: null, services: null, photos: null, booking: null, rest: [] };

    expect(campingParts(undefined)).toEqual(none);
    expect(campingParts([])).toEqual(none);
  });

  it('строка фактов: до двух первых строк цен «что — сумма ₽» через запятую; нет раздела — null', () => {
    const prices = PRICES_SECTION as CampingParts['prices'];
    const withRows = (rows: typeof PRICE_ROWS) => ({ ...prices!, rows });

    expect(campingFacts(prices)).toBe('До 5 человек — 2000 ₽, 1 человек — 800 ₽');
    expect(campingFacts(withRows(PRICE_ROWS.slice(0, 1)))).toBe('До 5 человек — 2000 ₽');
    expect(campingFacts(withRows([]))).toBeNull();
    expect(campingFacts(null)).toBeNull();
    expect(campingFacts(withRows([{ ...PRICE_ROWS[0], amount: 12000 }]))).toBe(
      `До 5 человек — ${formatAmount(12000)} ₽`,
    );
    expect(formatAmount(12000)).toBe('12\u00a0000');
  });

  it('номер телефона: цифры, пробелы, плюс, скобки и дефис, от 10 до 15 цифр — иначе сообщение', () => {
    for (const valid of ['8 906 213-44-55', '8 (4012) 37-99-26', '+7 (4012) 37-99-26']) {
      expect(validatePhone(valid), valid).toBe(true);
    }

    for (const invalid of [
      '',
      null,
      'позвоните Анастасии',
      '8 906',
      'tel:+79062134455',
      '89062134455 доб. 2',
      '1234567890123456',
      '8 906 +213-44-55',
    ]) {
      expect(typeof validatePhone(invalid), String(invalid)).toBe('string');
    }
  });

  it('раздел «Телефон» среди прочих разделов CmsSections рисует ссылкой tel: с номером и тем, кому звонить', () => {
    const markup = renderToStaticMarkup(<CmsSections sections={[BOOKING_SECTION]} />);

    expect(linksTo(markup, BOOKING_HREF)).toEqual(expect.arrayContaining([expect.stringContaining(BOOKING.phone)]));
    expect(plain(markup)).toContain(BOOKING.person);
  });
});
