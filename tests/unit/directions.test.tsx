import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DirectionsContent } from '@/app/(site)/kak-doehat/DirectionsContent';
import { directionsParts } from '@/app/(site)/kak-doehat/parts';
import type { DirectionsParts } from '@/app/(site)/kak-doehat/types';
import type { Media, Page } from '@/payload-types';

type Sections = NonNullable<Page['sections']>;
type Section = Sections[number];

const MAP_LINKS = [
  { id: 'm1', label: '2ГИС', url: 'https://2gis.ru/kaliningrad/directions/points/%7C20.278694%2C54.878228' },
  {
    id: 'm2',
    label: 'Яндекс Карты',
    url: 'https://yandex.ru/maps/org/poseleniye_vikingov_kaup/1685907695/?ll=20.43&z=8',
  },
  { id: 'm3', label: 'Google Карты', url: 'https://www.google.com/maps/place/@54.8781221,20.2767566,17z?entry=ttu' },
];

const TICKET_URL =
  'https://radario.ru/customer/afisha/07491527ea271252d4cf919044700687b69e8774898812c?openAsLinkKey=076uuwhz5i';

const NOTICE =
  'Время отправления и номер автобуса будут отправлены на электронную почту накануне мероприятия после 19:00.';

const STOPS = [
  { id: 's1', title: 'Из Калининграда', text: 'ул. Шевченко, 2, ориентир — парковка' },
  { id: 's2', title: 'Из Зеленоградска', text: 'ул. Ленина, 10, ориентир — автовокзал' },
  { id: 's3', title: 'Из Светлогорска-2', text: 'ул. Ленина, 33, ориентир — ЖД вокзал' },
  { id: 's4', title: 'Из Балтийска', text: 'пр-т Ленина, 12, ориентир — автовокзал' },
  { id: 's5', title: 'Из Гурьевска', text: 'Калининградское шоссе, 1А, ориентир — «Балтнефть»' },
];

/** Восемь разделов страницы `directions` из `research/kaup39/content/content.json`. */
const SECTIONS: Sections = [
  {
    id: 'a1',
    blockType: 'text',
    anchor: 'car',
    heading: 'Самостоятельный проезд',
    body: 'Для гостей с личным автомобилем предусмотрена большая бесплатная парковка.',
  },
  { id: 'a2', blockType: 'links', anchor: 'maps', heading: 'Проложите маршрут на картах', links: MAP_LINKS },
  {
    id: 'a3',
    blockType: 'list',
    anchor: 'bus',
    heading: 'На рейсовом автобусе',
    intro: 'До поселка можно добраться из Калининграда, Зеленоградска и Светлогорска.',
    items: [
      {
        id: 'b1',
        title: 'Калининград — Романово',
        text: 'Рейсовый автобус № 119',
        url: 'https://rasp.yandex.ru/bus/kaliningrad--romanovo',
      },
      {
        id: 'b2',
        title: 'Зеленоградск — Романово',
        text: 'Рейсовый автобус № 587',
        url: 'https://bus.tutu.ru/raspisanie/gorod_Zelenogradsk/',
      },
    ],
  },
  {
    id: 'a4',
    blockType: 'text',
    anchor: 'transfer',
    heading: 'Трансфер до поселения',
    body: 'Мы предоставляем трансфер до поселения викингов и обратно!',
  },
  {
    id: 'a5',
    blockType: 'list',
    anchor: 'transfer-stops',
    heading: 'Автобусы отправляются',
    items: STOPS,
    footnote: NOTICE,
  },
  {
    id: 'a6',
    blockType: 'prices',
    anchor: 'transfer-price',
    heading: 'Стоимость билета туда и обратно',
    rows: [{ id: 'p1', label: 'Одно место', amount: 600 }],
  },
  {
    id: 'a7',
    blockType: 'list',
    anchor: 'transfer-rules',
    heading: 'Важно',
    items: [
      { id: 'r1', title: 'Поездка на трансфере осуществляется только по предварительно купленным билетам' },
      { id: 'r2', title: 'Заказать и оплатить билеты можно только онлайн на сайте' },
      { id: 'r3', title: 'Для посадки в автобус необходимо распечатать билеты и предоставить их водителю' },
    ],
  },
  {
    id: 'a8',
    blockType: 'links',
    anchor: 'transfer-ticket',
    links: [{ id: 't1', label: 'Купить билет на трансфер', url: TICKET_URL }],
  },
];

const without = (...anchors: string[]) => SECTIONS.filter((section) => !anchors.includes(section.anchor ?? ''));

const ZIMA: Section = {
  id: 'z1',
  blockType: 'text',
  anchor: 'zima',
  heading: 'Зимой',
  body: 'Зимой поселение закрыто.',
};

const ADDRESS = 'Калининградская область, Зеленоградский район, поселок Романово';

const MEDIA = (alt: string, caption: string | null): Media => ({
  id: 7,
  alt,
  caption,
  temporary: false,
  url: '/api/media/file/parking.jpg',
  width: 1600,
  height: 1000,
  updatedAt: '2026-09-28T00:00:00.000Z',
  createdAt: '2026-09-28T00:00:00.000Z',
});

/** Непустые части без `rest`. */
const filled = (parts: DirectionsParts) =>
  Object.entries(parts)
    .filter(([key, value]) => key !== 'rest' && value !== null)
    .map(([, value]) => value as Section);

const render = (
  sections: Sections,
  map: { latitude: number; longitude: number } | null = { latitude: 54.87, longitude: 20.27 },
) =>
  renderToStaticMarkup(
    <DirectionsContent
      title="Как добраться"
      lead="Кауп находится недалеко от поселка Романово."
      address={ADDRESS}
      map={map}
      parts={directionsParts(sections)}
    />,
  );

/** Текст без разметки: неразрывные пробелы и сущности — обычными знаками. */
const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/ /g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Элемент с `id`: от открывающего тега до закрывающего с учетом вложенных тегов того же имени. */
const elementById = (markup: string, id: string) => {
  const open = new RegExp(`<([a-z0-9]+)\\b[^>]*\\bid="${id}"[^>]*>`).exec(markup);

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

const inside = (markup: string, id: string) => {
  const element = elementById(markup, id);

  if (!element) throw new Error(`в разметке нет элемента #${id}`);

  return element.html;
};

const count = (html: string, part: RegExp) => (html.match(part) ?? []).length;

/** Ссылка, внутри которой стоит `label`. */
const linkWith = (markup: string, label: string) => {
  const links = markup.match(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<\/a>/g) ?? [];

  return links.find((link) => plain(link).includes(label));
};

const attribute = (tag: string | undefined, name: string) =>
  tag?.match(new RegExp(`<a\\b[^>]*\\s${name}="([^"]*)"`))?.[1]?.replace(/&amp;/g, '&');

describe('страница «как доехать»: разделы CMS по частям', () => {
  it('разделы как в content.json: каждая часть получает свой раздел по якорю и типу блока, остального нет', () => {
    const parts = directionsParts(SECTIONS);

    expect(filled(parts).map((section) => section.anchor)).toEqual(
      expect.arrayContaining(SECTIONS.map((section) => section.anchor)),
    );
    expect(filled(parts)).toHaveLength(SECTIONS.length);
    expect(parts.maps).toEqual(SECTIONS[1]);
    expect(parts.price).toEqual(SECTIONS[5]);
    expect(parts.rules).toEqual(SECTIONS[6]);
    expect(parts.ticket).toEqual(SECTIONS[7]);
    expect(parts.rest).toEqual([]);
    // каждая часть — раздел с тем же якорем и типом блока, что в CMS
    for (const section of filled(parts)) {
      expect(SECTIONS.find((source) => source.anchor === section.anchor)).toEqual(section);
    }
  });

  it('раздела «Важно» нет — rules равен null, остальные семь частей на месте', () => {
    const parts = directionsParts(without('transfer-rules'));

    expect(parts.rules).toBeNull();
    expect(filled(parts).map((section) => section.anchor)).toEqual(
      expect.arrayContaining(without('transfer-rules').map((section) => section.anchor)),
    );
    expect(filled(parts)).toHaveLength(7);
    expect(parts.rest).toEqual([]);
  });

  it('чужой якорь и известный якорь с чужим типом блока попадают в rest в порядке CMS, price остается null', () => {
    const wrongType: Section = {
      id: 'w1',
      blockType: 'text',
      anchor: 'transfer-price',
      heading: 'Цена',
      body: 'Шестьсот рублей.',
    };
    const parts = directionsParts([ZIMA, wrongType, ...without('transfer-price')]);

    expect(parts.price).toBeNull();
    expect(parts.rest).toEqual([ZIMA, wrongType]);
    expect(filled(parts)).toHaveLength(7);
  });

  it('якорь повторяется — первый раздел в части, второй в rest', () => {
    const second: Section = {
      id: 'b9',
      blockType: 'list',
      anchor: 'bus',
      heading: 'Еще автобусы',
      items: [{ title: 'Балтийск — Романово' }],
    };
    const parts = directionsParts([...SECTIONS, second]);

    expect(parts.bus).toEqual(SECTIONS[2]);
    expect(parts.rest).toEqual([second]);
    expect(filled(parts)).toHaveLength(SECTIONS.length);
  });
});

describe('содержимое страницы «как доехать»', () => {
  it('ссылки на 2ГИС, Яндекс Карты и Google Карты ведут по адресам из CMS, открываются в новой вкладке с noopener', () => {
    const markup = render(SECTIONS);

    for (const { label, url } of MAP_LINKS) {
      const link = linkWith(markup, label);

      expect(link, `нет ссылки «${label}»`).toBeDefined();
      expect(attribute(link, 'href')).toBe(url);
      expect(attribute(link, 'target')).toBe('_blank');
      expect(attribute(link, 'rel')).toContain('noopener');
    }
  });

  it('кнопка «Купить билет на трансфер» ведет по ссылке раздела, цена 600 ₽ стоит в #transfer-price', () => {
    const markup = render(SECTIONS);

    expect(attribute(linkWith(markup, 'Купить билет на трансфер'), 'href')).toBe(TICKET_URL);

    const price = inside(markup, 'transfer-price').match(/<[a-z]+\b[^>]*\bdata-price\b[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';

    expect(plain(price)).toContain('600 ₽');
  });

  it('пять точек сбора — пункты #transfer-stops, оповещение — отдельно от пунктов и внутри #transfer, три пункта «Важно» — в #transfer-rules', () => {
    const markup = render(SECTIONS);
    const stops = inside(markup, 'transfer-stops');
    const items = stops.match(/<li\b[\s\S]*?<\/li>/g) ?? [];

    expect(items).toHaveLength(5);

    for (const { title, text } of STOPS) {
      const item = items.find((candidate) => plain(candidate).includes(title));

      expect(item, `нет точки «${title}»`).toBeDefined();
      expect(plain(item!)).toContain(text);
    }

    expect(items.filter((item) => plain(item).includes('19:00'))).toEqual([]);
    expect(plain(inside(markup, 'transfer'))).toContain(NOTICE);
    expect(count(inside(markup, 'transfer-rules'), /<li\b/g)).toBe(3);
  });

  it('у раздела car с фото есть figure с img; подпись совпала с alt — alt пустой, не совпала — alt остается; фото нет — figure нет', () => {
    const car = SECTIONS[0] as Extract<Section, { blockType: 'text' }>;
    const withPhoto = (media: Media): Sections => [{ ...car, photo: media }, ...SECTIONS.slice(1)];
    const figureOf = (markup: string) => inside(markup, 'car').match(/<figure\b[\s\S]*?<\/figure>/)?.[0] ?? '';
    const imgOf = (figure: string) => figure.match(/<img\b[^>]*>/)?.[0] ?? '';

    const same = figureOf(render(withPhoto(MEDIA('Парковка перед городищем', 'Парковка перед городищем'))));

    expect(same).toContain('<img');
    expect(imgOf(same)).toContain('src=');
    expect(imgOf(same)).toMatch(/\salt=""/);

    const differ = figureOf(render(withPhoto(MEDIA('Парковка перед городищем', 'Парковка и дорога'))));

    expect(imgOf(differ)).toMatch(/\salt="Парковка перед городищем"/);
    expect(plain(differ)).toContain('Парковка и дорога');

    expect(inside(render(SECTIONS), 'car')).not.toContain('<figure');
  });

  it('частей rules, ticket и maps нет — нет ни их заголовков, ни пустых оберток; прочие разделы идут после автобусов', () => {
    const markup = render([...without('transfer-rules', 'transfer-ticket', 'maps'), ZIMA]);

    expect(markup).not.toContain('Важно');
    expect(markup).not.toContain('id="transfer-rules"');
    expect(markup).not.toContain('id="transfer-ticket"');
    expect(markup).not.toContain('Купить билет на трансфер');
    expect(markup.toLowerCase()).not.toContain('маршрут на картах');
    expect(markup).not.toContain('2ГИС');

    const bus = elementById(markup, 'bus');
    const zima = elementById(markup, 'zima');

    expect(bus).not.toBeNull();
    expect(zima).not.toBeNull();
    expect(zima!.start).toBeGreaterThanOrEqual(bus!.end);
    expect(plain(zima!.html)).toContain('Зимой поселение закрыто.');
  });

  it('точки на карте нет — нет и кнопки «Показать карту», адрес на месте; точка есть — кнопка есть', () => {
    const withoutMap = render(SECTIONS, null);

    expect(withoutMap).not.toContain('Показать карту');
    expect(plain(withoutMap)).toContain(ADDRESS);
    expect(plain(render(SECTIONS))).toContain('Показать карту');
  });
});
