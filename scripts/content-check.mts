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
  ...content.events.flatMap((event) => event.gallery ?? []),
  ...content.zones.flatMap((zone) => (zone.photo ? [zone.photo] : [])),
  ...content.taverns.flatMap((tavern) => (tavern.photo ? [tavern.photo] : [])),
  ...content.pages.flatMap((page) => [
    ...[page.hero?.photoNight, page.hero?.photoDay].filter((file): file is string => Boolean(file)),
    ...page.sections.flatMap((section) => {
      if (section.blockType === 'photos') return section.photos;
      if (section.blockType === 'text' && section.photo) return [section.photo];

      return [];
    }),
  ]),
];

const BASES: PhotoBasis[] = ['owners', 'consent', 'license'];

/** Страница исходного сайта со стоковыми людьми Unsplash: кадры оттуда не переносятся. */
const STOCK_SOURCE = /kaup39\.ru\/corp(?![a-z0-9-])/i;

const recordProblems = ({ file, source, author, basis, basisProof }: PhotoRecord) => {
  const missing = [
    ...(source?.trim() ? [] : ['источника']),
    ...(author?.trim() ? [] : ['автора']),
    ...(BASES.includes(basis) ? [] : ['основания']),
  ];

  return [
    ...missing.map((field) => `у фотографии ${file} в реестре нет ${field}`),
    ...(basis !== 'owners' && BASES.includes(basis) && !basisProof?.trim()
      ? [`у стороннего кадра ${file} нет согласия автора или ссылки на лицензию`]
      : []),
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
  ...structureProblems(content, eventSlugs),
];
