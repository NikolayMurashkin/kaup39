import { DIRECTIONS_ANCHORS, HOME_ANCHORS, SETTLEMENT_TIME_ZONE } from '../../../src/cms/consts';
import type { ZoneMark } from '../../../src/cms/types';

/**
 * Проверочный контент e2e-базы. Он выдуман, потому что тестам нужны данные, которыми они управляют сами:
 * прошедшие даты рядом с будущими, пустое расписание, худшие для контраста кадры. Длинное слово без пробелов
 * стоит в каждом виде текста, который приходит из CMS: так тест переносов видит, что ни одно поле
 * не вылезает из контейнера.
 */
export const LONG_WORD = 'проверочнаястрокабезединогопробеладлятогочтобыонапереносиласьвнутриконтейнера';

/** Администратор e2e-базы: тест пустого расписания снимает даты через REST и возвращает их обратно. */
export const E2E_ADMIN = { email: 'e2e@kaup39.test', password: 'e2e-kaup39-password' };

/** Сдвиги дат от сегодняшнего дня по Калининграду: прошедшие даты на главной появляться не должны. */
export const PAST_OFFSETS = [-30, -2, -1];

export const FUTURE_OFFSETS = [1, 3, 8, 15, 22, 40];

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: SETTLEMENT_TIME_ZONE });

/** Сегодняшний день поселения строкой `YYYY-MM-DD`. */
export const settlementToday = (now = new Date()) => dayFormat.format(now);

export const shiftDay = (day: string, offset: number) => {
  const [year, month, date] = day.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
};

export type SeedImage = {
  file: string;
  alt: string;
  caption?: string;
  /** Базовая яркость кадра, 0–255: крайние значения — худший фон для текста своей темы. */
  tone: number;
};

/**
 * Кадры первого экрана выбраны худшими для своей темы: вечерний (темная тема, светлый текст) — почти
 * белый, дневной (светлая тема, темный текст) — почти черный. В галерее есть и тот и другой край:
 * подпись одна на обе темы.
 */
export const IMAGES = {
  night: { file: 'e2e-hero-night.jpg', alt: 'Проверочный вечерний кадр', tone: 236 },
  day: { file: 'e2e-hero-day.jpg', alt: 'Проверочный дневной кадр', tone: 18 },
  gallery: [
    { file: 'e2e-gallery-1.jpg', alt: 'Светлый проверочный кадр', caption: 'Светлый кадр', tone: 244 },
    { file: 'e2e-gallery-2.jpg', alt: 'Темный проверочный кадр', caption: 'Темный кадр', tone: 10 },
    { file: 'e2e-gallery-3.jpg', alt: 'Средний проверочный кадр', caption: LONG_WORD, tone: 128 },
    { file: 'e2e-gallery-4.jpg', alt: 'Второй светлый кадр', caption: 'Подпись кадра', tone: 200 },
    { file: 'e2e-gallery-5.jpg', alt: 'Второй темный кадр', tone: 60 },
  ],
} satisfies Record<string, SeedImage | SeedImage[]>;

export const EVENTS = [
  {
    slug: 'proverka-dnem',
    title: `Проверочный день ${LONG_WORD}`,
    summary: 'Короткое описание проверочного дневного события.',
    ticketUrl: 'https://radario.ru/customer/afisha/proverka-dnem',
    tariffs: [{ kind: 'entry' as const, amount: 700 }],
  },
  {
    slug: 'proverka-vecherom',
    title: 'Проверочный вечер',
    summary: 'Короткое описание проверочного вечернего события.',
    ticketUrl: 'https://radario.ru/customer/afisha/proverka-vecherom',
    tariffs: [
      { kind: 'adult' as const, amount: 1000 },
      { kind: 'child' as const, amount: 700 },
      { kind: 'family22' as const, amount: 2700 },
      { kind: 'family21' as const, amount: 2300 },
    ],
  },
];

const DAY = { event: 'proverka-dnem', start: '12:00', end: '15:00' };
const EVENING = { event: 'proverka-vecherom', start: '16:00', end: '19:00', show: '18:30' };

/** Элементы «с двух концов»: первый, последний, второй, предпоследний… */
const fromBothEnds = <T>(items: T[]) =>
  items.map((_, index) => items[index % 2 ? items.length - 1 - (index >> 1) : index >> 1]);

/**
 * Даты по сдвигам: прошедшие и будущие вперемешку по событиям. Пишутся с двух концов: ни порядок записи,
 * ни обратный ему (Payload без сортировки отдает `-createdAt`) не совпадают с порядком дат, поэтому
 * порядок ленты на главной держит сортировка расписания, а не засев.
 */
export const scheduleOf = (today: string) =>
  fromBothEnds([
    ...PAST_OFFSETS.map((offset, index) => ({ ...(index % 2 ? EVENING : DAY), date: shiftDay(today, offset) })),
    ...FUTURE_OFFSETS.map((offset, index) => ({ ...(index % 2 ? EVENING : DAY), date: shiftDay(today, offset) })),
  ]);

export const SITE = {
  name: `Проверочное поселение «${LONG_WORD}»`,
  tagline: 'Подпись проверочного поселения',
  ageNote: 'Возрастная маркировка 12+. Проверочная строка про возрастные ограничения.',
  address: `Проверочная область, ${LONG_WORD} район, 4 км от проверочного поселка`,
  phone: '8 (4000) 00-00-00',
  email: 'proverka-dlinnogo-adresa-kotoryi-dolzhen-perenositsya-vnutri-konteinera@example.com',
  legal: `ИП Проверочный ${LONG_WORD}, ИНН 000000000000`,
  socials: [
    { label: 'ВКонтакте', url: 'https://vk.com/proverka' },
    { label: 'YouTube', url: 'https://www.youtube.com/@proverka' },
  ],
  refund: {
    title: 'Возврат билетов',
    body: 'Проверочные условия возврата.',
    email: 'support@radario.ru',
    details: [{ text: 'Номер заказа' }],
  },
};

/**
 * Тексты первого экрана обычной длины — чуть длиннее настоящих. Засев кладет длинное слово во все тексты
 * сразу: так проверяются переносы, но с пятью такими текстами подряд первый экран не обязан вмещать кнопку.
 * Ссылку в первом экране проверяет state-тест на этих текстах.
 */
export const TYPICAL_FIRST_SCREEN = {
  site: {
    name: 'Проверочное поселение эпохи викингов',
    address: 'Проверочная область, Проверочный район, 4 км от проверочного поселка',
  },
  home: {
    title: 'Проверочное поселение эпохи викингов «Проверка»',
    lead: 'Проверочный подзаголовок первого экрана: атмосфера огня, ремесел и северных легенд',
  },
};

const paragraph = (text: string) => `${text} Обычные слова после длинного: ${LONG_WORD}, и еще немного текста.`;

export const HOME = {
  slug: 'home' as const,
  title: `Проверочное ${LONG_WORD} поселение`,
  lead: `Подзаголовок первого экрана из CMS: ${LONG_WORD} и обычные слова после него.`,
  sections: [
    {
      blockType: 'text' as const,
      anchor: 'about',
      heading: `О поселении ${LONG_WORD}`,
      body: paragraph('Первый абзац.'),
    },
    {
      blockType: 'text' as const,
      anchor: HOME_ANCHORS.events,
      heading: 'Ближайшие проверочные события',
      body: 'Поселение открыто для гостей только в дни событий — это проверочный текст.',
    },
    {
      blockType: 'text' as const,
      anchor: HOME_ANCHORS.zones,
      heading: 'Проверочные площадки',
      body: 'Вступление к площадкам.',
    },
    {
      blockType: 'text' as const,
      anchor: HOME_ANCHORS.kitchen,
      heading: 'Проверочная кухня',
      body: paragraph('Вступление к тавернам.'),
    },
    { blockType: 'photos' as const, anchor: 'gallery', heading: 'Как это выглядит' },
    {
      blockType: 'text' as const,
      anchor: HOME_ANCHORS.camping,
      heading: 'Ночевка под открытым небом',
      body: `${paragraph('Первый абзац про ночевку.')}\n\nВторой абзац про ночевку.`,
    },
    {
      blockType: 'prices' as const,
      anchor: 'camping-prices',
      heading: `Место 5 на 5 метров ${LONG_WORD}`,
      rows: [
        { label: `До пяти человек ${LONG_WORD}`, amount: 2000, note: 'Одно место под палатку и машину' },
        { label: 'Один человек', amount: 800, note: 'Одно место под палатку' },
        { label: 'Каждый дополнительный человек', amount: 300 },
      ],
    },
    {
      blockType: 'list' as const,
      anchor: 'camping-services',
      heading: `Что есть на месте ${LONG_WORD}`,
      items: [
        { title: 'Дрова', text: 'Одна связка бесплатно' },
        { title: LONG_WORD, text: LONG_WORD },
        { title: 'Вода', url: 'https://example.com/voda' },
      ],
    },
    { blockType: 'text' as const, anchor: 'rent', heading: 'Аренда целиком', body: paragraph('Про аренду.') },
    {
      blockType: 'prices' as const,
      anchor: 'rent-prices',
      heading: 'Стоимость аренды',
      rows: [{ label: 'Аренда', amount: 5000, unit: 'час' }],
      footnote: 'Подробности — по телефону.',
    },
  ],
};

/** Раздел страницы «как доехать», из которого главная берет плашку автобуса до поселения. */
export const DIRECTIONS = {
  slug: 'directions' as const,
  title: 'Как доехать (проверка)',
  sections: [
    {
      blockType: 'text' as const,
      anchor: DIRECTIONS_ANCHORS.transfer,
      heading: 'Проверочный автобус до места',
      body: `Автобус из пяти городов, время отправления присылаем накануне. ${LONG_WORD}\n\nВторой абзац.`,
    },
    {
      blockType: 'prices' as const,
      anchor: DIRECTIONS_ANCHORS.transferPrice,
      heading: `Билет туда и обратно ${LONG_WORD}`,
      rows: [{ label: 'Одно место', amount: 600 }],
    },
  ],
};

const ZONE_NAMES: [string, ZoneMark][] = [
  ['Проверочный дом', 'house'],
  ['Проверочная кузня', 'forge'],
  ['Проверочная мастерская', 'pot'],
  [LONG_WORD, 'bow'],
  ['Проверочный музей', 'shield'],
  ['Проверочная ладья', 'ship'],
  ['Проверочный зал', 'hall'],
];

export const ZONES = ZONE_NAMES.map(([name, mark], index) => ({
  name,
  slug: `proverka-zona-${index + 1}`,
  mark,
  order: index + 1,
  description:
    index === 3
      ? paragraph('Описание площадки.')
      : 'Описание проверочной площадки в две-три строки: что здесь можно увидеть и попробовать самому.',
}));

export const TAVERNS = [
  {
    name: `Первая проверочная таверна ${LONG_WORD}`,
    slug: 'proverka-taverna-1',
    order: 1,
    description: paragraph('Описание первой таверны.'),
    menu: [
      {
        title: `Горячее ${LONG_WORD}`,
        items: [
          { name: `Похлебка ${LONG_WORD}`, price: 350 },
          { name: 'Лепешка', note: 'С сыром или с мясом', price: 150, priceTo: 250 },
        ],
      },
      { title: 'Напитки', items: [{ name: 'Морс', price: 120 }] },
    ],
  },
  {
    name: 'Вторая проверочная таверна',
    slug: 'proverka-taverna-2',
    order: 2,
    description: 'Описание второй таверны.',
    menu: [{ items: [{ name: 'Каша', price: 200 }] }],
  },
  {
    name: 'Третья проверочная таверна',
    slug: 'proverka-taverna-3',
    order: 3,
    description: 'Меню у третьей таверны нет, только описание.',
  },
];
