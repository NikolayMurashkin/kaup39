import type { ContentFile, PhotoBasis, PhotoRecord, PhotoRegistry } from './content-types.ts';
import { GLYPHS } from './subset-glyphs.mts';

/** Опечатки исходного сайта, которые при переносе исправлены: вернуться в контент они не должны. */
const TYPOS: [RegExp, string][] = [
  [/марщрут/i, '«марщрут» → «маршрут»'],
  [/опытные матера/i, '«матера» → «мастера»'],
  [/наптки/i, '«НАПТКИ» → «Напитки»'],
  [/про прозвищу/i, '«про прозвищу» → «по прозвищу»'],
  [/вас будут предложены/i, '«вас будут предложены» → «вам будут предложены»'],
  [/где бы не появился/i, '«где бы не» → «где бы ни»'],
  [/(?<![а-яё])а так же/iu, '«а так же» → «а также»'],
  [/(?<![а-яё])в живую/iu, '«в живую» → «вживую»'],
  [/(?<![а-яё])на всегда/iu, '«на всегда» → «навсегда»'],
  [/огнедышащий драконы/i, '«огнедышащий драконы» → «огнедышащие драконы»'],
  [/эпичные сражением/i, '«эпичные сражением» → «эпичные сражения»'],
  [/атмосферу средневековье(?![а-яё])/iu, '«атмосферу средневековье» → «средневековья»'],
  [/в завершении вечера/i, '«в завершении вечера» → «в завершение»'],
  [/(?<![а-яё])Х века/u, 'кириллическая «Х» в римской цифре → латинская X'],
  [/\dх\d/u, 'кириллическая «х» между числами'],
  [/ор-р/, '«ор-р» → «ориентир»'],
  [/!!/, 'двойной восклицательный знак'],
];

/** Поддельное и служебное с исходного сайта: выдуманные отзывы, стоковые подписи, мусор Тильды. */
const FORBIDDEN: [RegExp, string][] = [
  [/edinoepole/i, 'вторая касса «Единое поле»: касса одна — Radario'],
  [/unsplash/i, 'служебный блок про стоковые фотографии Unsplash с /corp'],
  [/\(текущий год\)/i, 'незамененная подстановка Тильды «(текущий год)»'],
  [/Елена Смирнова|Александр Иванов|Мария Петрова/, 'выдуманный отзыв с /corp'],
  [/мероприятие в качестве гостя/i, 'подпись выдуманного отзыва с /corp'],
  [/наша команда/i, 'раздел «Наша команда» с /corp отложен до ответа владельцев'],
  [/profit ?team/i, 'подпись разработчика исходного сайта'],
  [/9062 37 99 26/, 'третий, неверный вариант телефона с /corp'],
  [/made on/i, 'подвал Тильды'],
  [/mc\.yandex\.ru|(?<!\d)93702550(?!\d)/i, 'счетчик Яндекс Метрики исходного сайта: чужие счетчики не переносятся'],
  [/top-fwz1\.mail\.ru|(?<!\d)3754437(?!\d)/i, 'счетчик VK top исходного сайта: чужие счетчики не переносятся'],
];

const ALLOWED = new Set([...GLYPHS, '\n']);

const codePoint = (character: string) => `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;

/** Все строки файла с путем до каждой: `pages[0].sections[2].items[1].title`. */
const strings = (value: unknown, path = ''): [string, string][] => {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => strings(item, path ? `${path}.${key}` : key));
  }

  return [];
};

const textProblems = ([path, text]: [string, string]) => [
  ...[...new Set(text)]
    .filter((character) => !ALLOWED.has(character))
    .map((character) => `${path}: знак «${character}» (${codePoint(character)}) вне набора сабсета шрифтов`),
  ...(/[ёЁ]/.test(text) ? [`${path}: «ё» — в текстах сайта пишется «е»`] : []),
  ...TYPOS.filter(([pattern]) => pattern.test(text)).map(([, fix]) => `${path}: опечатка исходника ${fix}`),
  ...FORBIDDEN.filter(([pattern]) => pattern.test(text)).map(([, what]) => `${path}: ${what}`),
];

const photoReferences = (content: ContentFile) => [
  ...content.events.flatMap((event) => [...(event.photo ? [event.photo] : []), ...(event.gallery ?? [])]),
  ...content.zones.flatMap((zone) => [...(zone.photo ? [zone.photo] : []), ...(zone.gallery ?? [])]),
  ...(content.albums ?? []).flatMap((album) => album.photos),
  ...content.taverns.flatMap((tavern) => (tavern.photo ? [tavern.photo] : [])),
  ...content.pages.flatMap((page) => [
    ...[page.hero?.photoNight, page.hero?.photoDay, page.teaser?.photo].filter((file): file is string => Boolean(file)),
    ...page.sections.flatMap((section) => {
      if (section.blockType === 'photos') return section.photos;
      if (section.blockType === 'text' && section.photo) return [section.photo];

      return [];
    }),
  ]),
];

const isPercent = (value: unknown) => typeof value === 'number' && value >= 0 && value <= 100;

/**
 * Точки карты: кадр из `media`, связь — на площадку или таверну этого файла и не на обе сразу, место в пределах рисунка,
 * slug не повторяется (по нему импорт находит запись). Номер может повторяться: у владельцев «8» стоит дважды.
 */
const mapPointProblems = (content: ContentFile) => {
  const points = content.mapPoints ?? [];
  const declared = new Set(content.media.map((item) => item.file));
  const zones = new Set(content.zones.map((zone) => zone.slug));
  const taverns = new Set(content.taverns.map((tavern) => tavern.slug));
  const slugs = points.map((point) => point.slug);

  return [
    ...points.flatMap(({ zone, tavern, photo, x, y }, index) => {
      const path = `mapPoints[${index}]`;

      return [
        ...(photo && !declared.has(photo) ? [`${path}.photo: фотография ${photo} не описана в media`] : []),
        ...(zone && !zones.has(zone) ? [`${path}.zone: площадки ${zone} в файле нет`] : []),
        ...(tavern && !taverns.has(tavern) ? [`${path}.tavern: таверны ${tavern} в файле нет`] : []),
        ...(zone && tavern ? [`${path}: связь и с площадкой, и с таверной — точка открывает одно окно`] : []),
        ...(['x', 'y'] as const)
          .filter((axis) => !isPercent({ x, y }[axis]))
          .map((axis) => `${path}.${axis}: место на рисунке — от 0 до 100 %`),
      ];
    }),
    ...[...new Set(slugs.filter((slug, index) => slugs.indexOf(slug) !== index))].map(
      (slug) => `точка карты ${slug} описана дважды`,
    ),
  ];
};

const BASES: PhotoBasis[] = ['owners', 'consent', 'license', 'temporary'];

/** Официальные каналы владельцев (D26, D31): кадр с другого адреса — чужой. */
const OWNER_SOURCES = [
  /^https:\/\/(www\.)?kaup39\.ru(\/|$)/i,
  /^https:\/\/(m\.)?vk\.(com|ru)\/(kaupfest(\/|$)|(wall|photo|album|video)-48845044_)/i,
  /^https:\/\/t\.me\/(s\/)?(kaupfest|nightkaup)(\/|$)/i,
  /^https:\/\/(www\.)?youtube\.com\/@kaupfestival5679(\/|$)/i,
];

/** Архив, который владельцы присылают сами: адреса в такой строке не проверяются. */
const OWNER_ARCHIVE = /^архив владельцев/i;

/** Кадр владельцев: из их архива или каждый адрес в источнике — их канал (пост и кадр в нем пишутся парой). */
const fromOwners = (source: string) => {
  const addresses = source.match(/https?:\/\/[^\s()]+/g) ?? [];

  return (
    OWNER_ARCHIVE.test(source) ||
    (addresses.length > 0 && addresses.every((address) => OWNER_SOURCES.some((pattern) => pattern.test(address))))
  );
};

/** Страница исходного сайта со стоковыми людьми Unsplash: кадры оттуда не переносятся. */
const STOCK_SOURCE = /kaup39\.ru\/corp(?![a-z0-9-])/i;

const isPageAddress = (source: string) =>
  URL.canParse(source) && ['http:', 'https:'].includes(new URL(source).protocol);

const basisProblems = ({ file, source, basis, basisProof }: PhotoRecord) => {
  const known = source?.trim() ? source : '';

  if (basis === 'owners') {
    return !known || fromOwners(known)
      ? []
      : [`кадр ${file} не из каналов владельцев: чужому кадру нужны согласие автора, лицензия или отметка временного`];
  }

  if (basis === 'temporary') {
    return !known || isPageAddress(known)
      ? []
      : [`у временного кадра ${file} источник не адрес страницы, где кадр найден (https://…)`];
  }

  return BASES.includes(basis) && !basisProof?.trim()
    ? [`у стороннего кадра ${file} нет согласия автора или ссылки на лицензию`]
    : [];
};

const recordProblems = (record: PhotoRecord) => {
  const { file, source, author, basis } = record;
  const missing = [
    ...(source?.trim() ? [] : ['источника']),
    ...(author?.trim() ? [] : ['автора']),
    ...(BASES.includes(basis) ? [] : ['основания']),
  ];

  return [
    ...missing.map((field) => `у фотографии ${file} в реестре нет ${field}`),
    ...basisProblems(record),
    ...(STOCK_SOURCE.test(source ?? '') ? [`фотография ${file} с /corp — там стоковые люди Unsplash`] : []),
  ];
};

const photoProblems = (content: ContentFile, registry: PhotoRegistry) => {
  const declared = new Set(content.media.map((item) => item.file));
  const records = new Map(registry.photos.map((record) => [record.file, record]));

  return [
    ...photoReferences(content)
      .filter((file) => !declared.has(file))
      .map((file) => `фотография ${file} использована, но не описана в media`),
    ...content.media.flatMap(({ file }) => {
      const record = records.get(file);

      return record ? recordProblems(record) : [`фотография ${file} без строки в реестре происхождения (photos.json)`];
    }),
  ];
};

const albumProblems = (content: ContentFile, registry: PhotoRegistry) => {
  const albums = content.albums ?? [];
  const temporary = new Set(registry.photos.filter(({ basis }) => basis === 'temporary').map(({ file }) => file));
  const placed = new Map<string, string[]>();

  for (const { slug, photos } of albums) {
    for (const file of new Set(photos)) {
      placed.set(file, [...(placed.get(file) ?? []), slug]);
    }
  }

  return [
    ...[...placed]
      .filter(([, slugs]) => slugs.length > 1)
      .map(
        ([file, slugs]) =>
          `кадр ${file} стоит в нескольких альбомах (${slugs.join(', ')}): один кадр — в одном альбоме`,
      ),
    ...albums.flatMap(({ slug, photos }) =>
      [...new Set(photos)]
        .filter((file) => temporary.has(file))
        .map((file) => `в альбоме ${slug} временный кадр ${file}: в альбомах только кадры «Каупа» (D43)`),
    ),
  ];
};

const structureProblems = (content: ContentFile, eventSlugs: string[]) => {
  const contentSlugs = content.events.map((event) => event.slug);
  const pageSlugs = content.pages.map((page) => page.slug);

  return [
    ...eventSlugs
      .filter((slug) => !contentSlugs.includes(slug))
      .map((slug) => `у события ${slug} из facts.ts нет текстов в файле контента`),
    ...contentSlugs
      .filter((slug) => !eventSlugs.includes(slug))
      .map((slug) => `у события ${slug} нет фактов в facts.ts: цены и кассы без них не будет`),
    ...pageSlugs
      .filter((slug, index) => pageSlugs.indexOf(slug) !== index)
      .map((slug) => `страница ${slug} описана дважды`),
  ];
};

/**
 * Проблемы файла контента, из-за которых импорт не запускается: знак вне сабсета шрифтов отрисовался бы
 * запасной гарнитурой, опечатка исходника вернулась бы на сайт, поддельное попало бы в CMS, кадр без
 * источника, автора или основания в реестре происхождения попал бы в медиатеку (D31).
 */
export const contentProblems = (content: ContentFile, registry: PhotoRegistry, eventSlugs: string[]) => [
  ...strings(content).flatMap(textProblems),
  ...photoProblems(content, registry),
  ...albumProblems(content, registry),
  ...mapPointProblems(content),
  ...structureProblems(content, eventSlugs),
];
