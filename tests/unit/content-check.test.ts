import { describe, expect, it } from 'vitest';
import { contentProblems } from '../../scripts/content-check.mts';
import type { ContentFile, PhotoRecord, PhotoRegistry } from '../../scripts/content-types';

const NBSP = String.fromCodePoint(0x00a0);

/** Проверочный файл контента: тексты придуманы для теста и владельцам не принадлежат. */
const content = (): ContentFile => ({
  site: {
    name: 'Проверочное поселение',
    address: 'Проверочный адрес',
    phone: '8 (000) 00-00-00',
    email: 'test@example.com',
    socials: [],
    refund: { title: 'Возврат', body: 'Условия возврата.', email: 'refund@example.com', details: ['Номер заказа'] },
  },
  media: [{ file: 'owner-photo.jpg', alt: 'Проверочный кадр' }],
  events: [
    { slug: 'proverka', title: 'Проверочное событие', description: `Первый абзац.\n\nВторой${NBSP}абзац — 700 ₽.` },
  ],
  zones: [],
  taverns: [],
  pages: [
    {
      slug: 'home',
      title: 'Главная',
      hero: { photoNight: 'owner-photo.jpg' },
      sections: [{ blockType: 'photos', photos: ['owner-photo.jpg'] }],
    },
  ],
});

/** Строка реестра к проверочному кадру: источник, автор и основание придуманы для теста. */
const record = (overrides: Partial<PhotoRecord> = {}): PhotoRecord => ({
  file: 'owner-photo.jpg',
  source: 'https://example.com/owners/album',
  author: 'Проверочный фотограф',
  basis: 'owners',
  subject: 'Проверочная площадка днем',
  slots: ['hero-night'],
  ...overrides,
});

const registry = (...photos: PhotoRecord[]): PhotoRegistry => ({
  photos: photos.length > 0 ? photos : [record()],
  noPhoto: [],
});

const withDescription = (description: string) => {
  const file = content();

  file.events[0].description = description;

  return file;
};

describe('проверка файла контента перед импортом', () => {
  it('чистый файл проходит: неразрывный пробел, тире и знак рубля есть в наборе сабсета', () => {
    expect(contentProblems(content(), registry(), ['proverka'])).toEqual([]);
  });

  it('знак вне сабсета называется с путем и кодом', () => {
    expect(contentProblems(withDescription('Место 5×5 метров'), registry(), ['proverka'])).toEqual([
      'events[0].description: знак «×» (U+00D7) вне набора сабсета шрифтов',
    ]);
  });

  it('«ё» не проходит', () => {
    expect(contentProblems(withDescription('Рагнарёк'), registry(), ['proverka'])).toEqual([
      'events[0].description: «ё» — в текстах сайта пишется «е»',
    ]);
  });

  it.each([
    'Проверка: марщрут',
    'Проверка: опытные матера',
    'Проверка: НАПТКИ',
    'Проверка: про прозвищу',
    'Проверка: вас будут предложены',
    'Проверка: где бы не появился',
    'Проверка: а так же',
    'Проверка: в живую',
    'Проверка: на всегда',
    'Проверка: огнедышащий драконы',
    'Проверка: эпичные сражением',
    'Проверка: атмосферу средневековье',
    'Проверка: в завершении вечера',
    'Проверка: Х века',
    'Проверка: 5х5',
    'Проверка: ор-р',
    'Проверка!!',
  ])('опечатка исходника «%s» не возвращается', (text) => {
    expect(contentProblems(withDescription(text), registry(), ['proverka'])).toEqual([
      expect.stringMatching(/^events\[0\]\.description: опечатка исходника /),
    ]);
  });

  it('исправленные формы проходят: границы слов не задевают «она так же», «Ростов живую» и «она всегда»', () => {
    const fixed =
      'Верный маршрут. Она так же рада, она всегда рядом. Ростов живую встречает. Монета X века, поле 5 на 5 метров.';

    expect(contentProblems(withDescription(fixed), registry(), ['proverka'])).toEqual([]);
  });

  it.each([
    'https://kaup39.edinoepole.ru/widget/events',
    'Изображения: Unsplash',
    ', (текущий год)',
    'Елена Смирнова',
    'Проверка: мероприятие в качестве гостя',
    'Наша команда',
    'Profit Team',
    '9062 37 99 26',
    'Made on Tilda',
  ])('поддельное и служебное с исходного сайта не переносится: «%s»', (text) => {
    expect(contentProblems(withDescription(text), registry(), ['proverka'])).toHaveLength(1);
  });

  it('фотография, использованная в разделах, но не описанная в media, не проходит', () => {
    const file = content();

    file.pages[0].hero = { photoDay: 'undeclared.jpg' };

    expect(contentProblems(file, registry(), ['proverka'])).toEqual([
      'фотография undeclared.jpg использована, но не описана в media',
    ]);
  });

  it('фотография без строки в реестре происхождения останавливает импорт', () => {
    const file = content();

    file.media.push({ file: 'found-somewhere.jpg', alt: 'Кадр без происхождения' });

    expect(contentProblems(file, registry(), ['proverka'])).toEqual([
      'фотография found-somewhere.jpg без строки в реестре происхождения (photos.json)',
    ]);
  });

  it.each([
    ['источника', { source: '' }],
    ['автора', { author: ' ' }],
    ['основания', { basis: undefined }],
    ['основания', { basis: 'нашли в поиске' }],
  ])('у фотографии в реестре нет %s — импорт останавливается', (field, overrides) => {
    const broken = record(overrides as Partial<PhotoRecord>);

    expect(contentProblems(content(), registry(broken), ['proverka'])).toEqual([
      `у фотографии owner-photo.jpg в реестре нет ${field}`,
    ]);
  });

  it.each(['consent', 'license'] as const)(
    'сторонний кадр (%s) без согласия автора или ссылки на лицензию не импортируется',
    (basis) => {
      expect(contentProblems(content(), registry(record({ basis })), ['proverka'])).toEqual([
        'у стороннего кадра owner-photo.jpg нет согласия автора или ссылки на лицензию',
      ]);
      expect(
        contentProblems(content(), registry(record({ basis, basisProof: 'https://example.com/license' })), [
          'proverka',
        ]),
      ).toEqual([]);
    },
  );

  it('кадр со стоковой /corp исходного сайта не проходит и со строкой в реестре', () => {
    const corp = record({ source: 'https://kaup39.ru/corp' });

    expect(contentProblems(content(), registry(corp), ['proverka'])).toEqual([
      'фотография owner-photo.jpg с /corp — там стоковые люди Unsplash',
    ]);
  });

  it('события файла контента и facts.ts совпадают по slug', () => {
    expect(contentProblems(content(), registry(), ['proverka', 'ragnarek'])).toEqual([
      'у события ragnarek из facts.ts нет текстов в файле контента',
    ]);
    expect(contentProblems(content(), registry(), [])).toEqual([
      'у события proverka нет фактов в facts.ts: цены и кассы без них не будет',
    ]);
  });
});
