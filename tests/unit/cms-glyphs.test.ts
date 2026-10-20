import { join } from 'node:path';
import type { Field, SanitizedConfig } from 'payload';
import { describe, expect, it } from 'vitest';
import {
  collectTexts,
  fontCharacters,
  formatReport,
  type CmsSource,
  type CmsText,
  type GlyphProblem,
  missingGlyphs,
  restSource,
  runCheck,
} from '../../scripts/cms-glyphs.mts';
import { readCharacters } from '../../scripts/sfnt-cmap.mts';
import { GLYPHS } from '../../scripts/subset-glyphs.mts';
import { FONTS_DIR } from '../lib/files';

const NBSP = String.fromCodePoint(0x00a0);

const byPath = (texts: CmsText[]) => [...texts].sort((left, right) => left.path.localeCompare(right.path));

/** Подставные шрифты: по умолчанию в каждом файле весь набор сабсета плюс то, что добавил тест. */
const fontSets = ({
  golos = new Set(GLYPHS),
  ponomar = new Set(GLYPHS),
  forum = new Set(GLYPHS),
}: Partial<Record<'golos' | 'ponomar' | 'forum', Set<string>>> = {}) => ({
  glyphs: GLYPHS,
  required: [{ file: 'golos-text.woff2', chars: golos }],
  optional: [
    { file: 'ponomar.woff2', chars: ponomar },
    { file: 'forum.woff2', chars: forum },
  ],
});

const without = (char: string) => new Set([...GLYPHS].filter((glyph) => glyph !== char));
const withExtra = (char: string) => new Set([...GLYPHS, char]);

/** Проверочные тексты теста — не контент владельцев. */
describe('тексты полей CMS по конфигу Payload', () => {
  it('КОГДА поля text и textarea верхнего уровня заполнены ТОГДА оба в списке с путем и текстом как есть', () => {
    const fields: Field[] = [
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
    ];
    const doc = { id: 7, title: 'Проверочная площадка', description: `Первый абзац.\n\nВторой${NBSP}абзац — 700 ₽.` };

    expect(byPath(collectTexts(fields, doc, 'zones/7'))).toEqual([
      { path: 'zones/7.description', text: `Первый абзац.\n\nВторой${NBSP}абзац — 700 ₽.` },
      { path: 'zones/7.title', text: 'Проверочная площадка' },
    ]);
  });

  it('КОГДА текст лежит в array → group → row/tabs и в blocks ТОГДА полный путь до поля, поле блока другого blockType не берется', () => {
    const fields: Field[] = [
      {
        name: 'sections',
        type: 'blocks',
        blocks: [
          { slug: 'text', fields: [{ name: 'body', type: 'textarea' }] },
          {
            slug: 'list',
            fields: [
              { name: 'heading', type: 'text' },
              {
                name: 'items',
                type: 'array',
                fields: [
                  { name: 'title', type: 'text' },
                  { name: 'text', type: 'textarea' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'rows',
        type: 'array',
        fields: [
          {
            name: 'meta',
            type: 'group',
            fields: [
              { type: 'row', fields: [{ name: 'note', type: 'text' }] },
              {
                type: 'tabs',
                tabs: [
                  { label: 'Подпись', fields: [{ name: 'caption', type: 'text' }] },
                  { name: 'extra', label: 'Еще', fields: [{ name: 'hint', type: 'textarea' }] },
                ],
              },
            ],
          },
        ],
      },
    ];
    const doc = {
      id: 3,
      sections: [
        { blockType: 'text', body: 'Первый раздел' },
        { blockType: 'text', body: 'Второй раздел', items: [{ title: 'Чужой пункт', text: 'Чужое пояснение' }] },
        {
          blockType: 'list',
          heading: 'Список',
          items: [{ title: 'Пункт', text: 'Пояснение пункта' }],
          body: 'Чужое поле блока',
        },
      ],
      rows: [{ meta: { note: 'Заметка', caption: 'Подпись кадра', extra: { hint: 'Подсказка' } } }],
    };

    expect(byPath(collectTexts(fields, doc, 'pages/3'))).toEqual(
      byPath([
        { path: 'pages/3.sections[0].body', text: 'Первый раздел' },
        { path: 'pages/3.sections[1].body', text: 'Второй раздел' },
        { path: 'pages/3.sections[2].heading', text: 'Список' },
        { path: 'pages/3.sections[2].items[0].title', text: 'Пункт' },
        { path: 'pages/3.sections[2].items[0].text', text: 'Пояснение пункта' },
        { path: 'pages/3.rows[0].meta.note', text: 'Заметка' },
        { path: 'pages/3.rows[0].meta.caption', text: 'Подпись кадра' },
        { path: 'pages/3.rows[0].meta.extra.hint', text: 'Подсказка' },
      ]),
    );
  });

  it('КОГДА в документе number, select, date, checkbox, relationship, upload и email ТОГДА в списке их нет', () => {
    const fields: Field[] = [
      { name: 'title', type: 'text' },
      { name: 'order', type: 'number' },
      { name: 'mark', type: 'select', options: ['house', 'forge'] },
      { name: 'date', type: 'date' },
      { name: 'hidden', type: 'checkbox' },
      { name: 'event', type: 'relationship', relationTo: 'events' },
      { name: 'photo', type: 'upload', relationTo: 'media' },
      { name: 'cover', type: 'upload', relationTo: 'media' },
      { name: 'email', type: 'email' },
    ];
    const doc = {
      id: 5,
      title: 'Проверочная таверна',
      order: 2,
      mark: 'forge',
      date: '2026-10-24T12:00:00.000Z',
      hidden: false,
      event: 12,
      photo: 4,
      cover: { id: 9, alt: 'Подпись проверочного кадра', filename: 'proverka.jpg', mimeType: 'image/jpeg' },
      email: 'proverka@example.com',
    };

    expect(collectTexts(fields, doc, 'taverns/5')).toEqual([{ path: 'taverns/5.title', text: 'Проверочная таверна' }]);
  });

  it('КОГДА значение null, undefined, пустая строка или поля нет в документе ТОГДА строк нет и ошибки нет', () => {
    const fields: Field[] = [
      { name: 'name', type: 'text' },
      { name: 'tagline', type: 'text' },
      { name: 'legal', type: 'text' },
      { name: 'ageNote', type: 'textarea' },
      { name: 'lead', type: 'textarea' },
      { name: 'refund', type: 'group', fields: [{ name: 'title', type: 'text' }] },
      { name: 'socials', type: 'array', fields: [{ name: 'label', type: 'text' }] },
      { name: 'sections', type: 'blocks', blocks: [{ slug: 'text', fields: [{ name: 'body', type: 'textarea' }] }] },
    ];
    const doc = {
      name: 'Проверочное поселение',
      tagline: null,
      legal: undefined,
      ageNote: '',
      refund: null,
      socials: null,
      sections: undefined,
    };

    expect(collectTexts(fields, doc, 'globals/site')).toEqual([
      { path: 'globals/site.name', text: 'Проверочное поселение' },
    ]);
  });
});

describe('знаки текстов против набора сабсета и файлов шрифтов', () => {
  it('КОГДА в тексте знак вне GLYPHS ТОГДА в findings знак, его код, путь поля и GLYPHS среди недостающего', () => {
    const report = missingGlyphs(
      [{ path: 'zones/7.description', text: 'Готово ✓' }],
      fontSets({ golos: new Set(GLYPHS), ponomar: withExtra('✓'), forum: withExtra('✓') }),
    );

    expect(report.findings).toEqual([
      { char: '✓', codePoint: 'U+2713', paths: ['zones/7.description'], missing: ['GLYPHS', 'golos-text.woff2'] },
    ]);
  });

  it('КОГДА знака нет в golos-text.woff2 ТОГДА находка; КОГДА его нет только в ponomar.woff2 ТОГДА только предупреждение', () => {
    const golosGap = missingGlyphs(
      [{ path: 'pages/3.lead', text: 'Сезон — весь год' }],
      fontSets({ golos: without('—') }),
    );

    expect(golosGap.findings).toEqual([
      { char: '—', codePoint: 'U+2014', paths: ['pages/3.lead'], missing: ['golos-text.woff2'] },
    ]);

    const ponomarGap = missingGlyphs(
      [{ path: 'pages/3.title', text: 'Площадка № 2' }],
      fontSets({ ponomar: without('№') }),
    );

    expect(ponomarGap.findings).toEqual([]);
    expect(ponomarGap.warnings).toEqual([
      { char: '№', codePoint: 'U+2116', paths: ['pages/3.title'], missing: ['ponomar.woff2'] },
    ]);
  });

  it('КОГДА все знаки покрыты, включая неразрывный пробел и знак рубля ТОГДА findings и warnings пусты', () => {
    const texts = [
      { path: 'events/1.title', text: `Вход${NBSP}— 700${NBSP}₽` },
      { path: 'globals/site.tagline', text: '«Кауп» — поселение викингов…' },
    ];

    expect(missingGlyphs(texts, fontSets())).toEqual({ findings: [], warnings: [] });
  });

  it('КОГДА один знак в трех полях ТОГДА одна находка со всеми путями; эмодзи — одна находка, не две половинки суррогатной пары', () => {
    const { findings } = missingGlyphs(
      [
        { path: 'zones/1.name', text: 'Готово ✓' },
        { path: 'zones/2.description', text: '✓ принято' },
        { path: 'globals/site.tagline', text: 'да ✓ 😀' },
      ],
      fontSets(),
    );
    const check = findings.find(({ char }) => char === '✓');

    expect(findings.map(({ char }) => char).sort()).toEqual(['✓', '😀'].sort());
    expect([...(check?.paths ?? [])].sort()).toEqual(['globals/site.tagline', 'zones/1.name', 'zones/2.description']);
    expect(findings.find(({ char }) => char === '😀')).toEqual(
      expect.objectContaining({ codePoint: 'U+1F600', paths: ['globals/site.tagline'] }),
    );
  });

  it('КОГДА в textarea переводы строк \\n, \\r\\n и табуляция ТОГДА находок нет', () => {
    const texts = [{ path: 'pages/3.lead', text: 'Первый абзац.\n\nВторой\r\nабзац\tс табуляцией' }];

    expect(missingGlyphs(texts, fontSets())).toEqual({ findings: [], warnings: [] });
  });
});

describe('знаки из таблицы cmap настоящих файлов шрифтов', () => {
  it('golos-text, ponomar и forum: есть знаки набора и известные пробелы шрифтов', async () => {
    const golos = await fontCharacters(join(FONTS_DIR, 'golos-text.woff2'));
    const ponomar = await fontCharacters(join(FONTS_DIR, 'ponomar.woff2'));
    const forum = await fontCharacters(join(FONTS_DIR, 'forum.woff2'));

    expect(['А', '₽', '№'].filter((char) => !golos.has(char))).toEqual([]);
    expect(['Ѐ', 'ѝ'].filter((char) => golos.has(char))).toEqual([]);
    expect(ponomar.has('А')).toBe(true);
    expect(['№', '₽'].filter((char) => ponomar.has(char))).toEqual([]);
    expect(forum.has('А')).toBe(true);
    expect(['Ѐ', '₽'].filter((char) => forum.has(char))).toEqual([]);
  });
});

describe('вывод проверки', () => {
  const quoted = (char: string) => new RegExp(`[«"'“]${char}[»"'”]`);

  it('КОГДА находка есть ТОГДА строка называет знак в кавычках, его код, путь поля и чего нет', () => {
    const findings: GlyphProblem[] = [
      { char: '✓', codePoint: 'U+2713', paths: ['zones/7.description'], missing: ['GLYPHS'] },
      { char: '—', codePoint: 'U+2014', paths: ['globals/site.tagline'], missing: ['golos-text.woff2'] },
    ];
    const lines = formatReport({ findings, warnings: [] });

    expect(
      lines.filter(
        (line) =>
          quoted('✓').test(line) &&
          line.includes('U+2713') &&
          line.includes('zones/7.description') &&
          line.includes('нет в GLYPHS'),
      ),
    ).toHaveLength(1);
    expect(
      lines.filter(
        (line) =>
          quoted('—').test(line) &&
          line.includes('U+2014') &&
          line.includes('globals/site.tagline') &&
          line.includes('нет в golos-text.woff2'),
      ),
    ).toHaveLength(1);
  });

  it('КОГДА есть только предупреждение ТОГДА строка с пометкой «предупреждение», знаком, путем и файлом; строк находок нет', () => {
    const warnings: GlyphProblem[] = [
      { char: '№', codePoint: 'U+2116', paths: ['pages/3.title'], missing: ['ponomar.woff2'] },
    ];
    const lines = formatReport({ findings: [], warnings });
    const fieldLines = lines.filter((line) => line.includes('pages/3.title'));

    expect(
      fieldLines.filter(
        (line) =>
          line.toLowerCase().includes('предупреждение') &&
          quoted('№').test(line) &&
          line.includes('нет в ponomar.woff2'),
      ),
    ).toHaveLength(1);
    expect(fieldLines.filter((line) => !line.toLowerCase().includes('предупреждение'))).toEqual([]);
    expect(lines.filter((line) => line.includes('нет в GLYPHS') || line.includes('нет в golos-text.woff2'))).toEqual(
      [],
    );
  });
});

type FetchCall = { url: URL; method: string; headers: Headers; body: string };

const STAND = 'https://stand.example';
const TOKEN = 'proverochnyj-token';
const CREDENTIALS = { email: 'admin@example.com', password: 'proverochnyj-parol' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Подставной fetch: запоминает каждый запрос и отвечает тем, что вернул `respond`. */
const fakeFetch = (respond: (call: FetchCall) => Response) => {
  const calls: FetchCall[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const call = {
      url: new URL(request.url),
      method: request.method,
      headers: request.headers,
      body: await request.text(),
    };

    calls.push(call);

    return respond(call);
  }) as typeof fetch;

  return { calls, fetchImpl };
};

const standResponse = ({ url }: FetchCall) => {
  if (url.pathname === '/api/users/login') {
    return json({ message: 'Auth Passed', token: TOKEN, user: { id: 1, email: CREDENTIALS.email } });
  }

  return url.pathname.startsWith('/api/globals/') ? json({ id: 1 }) : json({ docs: [], totalDocs: 0 });
};

const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (error: unknown) => error,
  );

describe('чтение CMS через REST стенда', () => {
  it('КОГДА чтение ТОГДА сначала вход, затем коллекция и глобал без пагинации, с глубиной 0 и токеном', async () => {
    const { calls, fetchImpl } = fakeFetch(standResponse);
    const source = await restSource(STAND, CREDENTIALS.email, CREDENTIALS.password, fetchImpl);

    await source.find('zones');
    await source.findGlobal('site');

    expect(calls.map(({ method, url }) => `${method} ${url.origin}${url.pathname}`)).toEqual([
      `POST ${STAND}/api/users/login`,
      `GET ${STAND}/api/zones`,
      `GET ${STAND}/api/globals/site`,
    ]);

    const [login, zones, site] = calls;

    expect(JSON.parse(login.body)).toEqual(CREDENTIALS);
    expect([zones.url.searchParams.get('depth'), zones.url.searchParams.get('pagination')]).toEqual(['0', 'false']);
    expect(site.url.searchParams.get('depth')).toBe('0');
    expect([zones.headers.get('authorization'), site.headers.get('authorization')]).toEqual([
      `JWT ${TOKEN}`,
      `JWT ${TOKEN}`,
    ]);
  });

  it('КОГДА вход отвечает 401 ТОГДА исключение про вход и ни одного запроса коллекций', async () => {
    const { calls, fetchImpl } = fakeFetch(({ url }) =>
      url.pathname === '/api/users/login'
        ? json({ errors: [{ message: 'The email or password provided is incorrect.' }] }, 401)
        : standResponse({ url } as FetchCall),
    );
    const read = async () => {
      const source = await restSource(STAND, CREDENTIALS.email, CREDENTIALS.password, fetchImpl);

      await source.find('zones');
      await source.findGlobal('site');
    };

    await expect(read()).rejects.toThrow(/вход|войти/i);
    expect(calls.filter(({ url }) => url.pathname !== '/api/users/login')).toEqual([]);
  });

  it('КОГДА коллекция отвечает 500 или 403 ТОГДА исключение с именем коллекции и кодом', async () => {
    const { fetchImpl } = fakeFetch((call) => {
      if (call.url.pathname === '/api/zones') {
        return json({ errors: [{ message: 'Something went wrong.' }] }, 500);
      }

      if (call.url.pathname === '/api/reviews') {
        return json({ errors: [{ message: 'You are not allowed to perform this action.' }] }, 403);
      }

      return standResponse(call);
    });
    const source = await restSource(STAND, CREDENTIALS.email, CREDENTIALS.password, fetchImpl);
    const serverError = await rejection(source.find('zones'));
    const forbidden = await rejection(source.find('reviews'));

    expect(serverError).toBeInstanceOf(Error);
    expect(forbidden).toBeInstanceOf(Error);
    expect([
      ['zones', '500'].filter((part) => !(serverError as Error).message.includes(part)),
      ['reviews', '403'].filter((part) => !(forbidden as Error).message.includes(part)),
    ]).toEqual([[], []]);
  });
});

describe('ветки обхода полей вне текущего конфига', () => {
  it('КОГДА text с hasMany, поле в collapsible и в group без имени ТОГДА пути по элементам массива и без имен обертки', () => {
    const fields = [
      { name: 'tags', type: 'text', hasMany: true },
      { type: 'collapsible', label: 'Подробности', fields: [{ name: 'note', type: 'textarea' }] },
      { type: 'group', label: 'Подпись', fields: [{ name: 'caption', type: 'text' }] },
    ] as Field[];
    const doc = { id: 7, tags: ['первый', 'второй'], note: 'Заметка', caption: 'Подпись кадра' };

    expect(byPath(collectTexts(fields, doc, 'zones/7'))).toEqual([
      { path: 'zones/7.caption', text: 'Подпись кадра' },
      { path: 'zones/7.note', text: 'Заметка' },
      { path: 'zones/7.tags[0]', text: 'первый' },
      { path: 'zones/7.tags[1]', text: 'второй' },
    ]);
  });
});

const u16 = (...values: number[]) => {
  const buffer = Buffer.alloc(values.length * 2);

  values.forEach((value, index) => buffer.writeUInt16BE(value & 0xffff, index * 2));

  return buffer;
};

const u32 = (...values: number[]) => {
  const buffer = Buffer.alloc(values.length * 4);

  values.forEach((value, index) => buffer.writeUInt32BE(value, index * 4));

  return buffer;
};

type Segment = { start: number; end: number; delta: number; glyphs?: number[] };

/** Подтаблица формата 4: `glyphs` — сегмент через `idRangeOffset`, иначе через `idDelta`. */
const cmapFormat4 = (segments: Segment[]) => {
  const glyphIds: number[] = [];
  const rangeOffsets = segments.map(({ glyphs }, index) => {
    if (!glyphs) return 0;

    const offset = (segments.length - index + glyphIds.length) * 2;

    glyphIds.push(...glyphs);

    return offset;
  });
  const body = Buffer.concat([
    u16(...segments.map(({ end }) => end)),
    u16(0),
    u16(...segments.map(({ start }) => start)),
    u16(...segments.map(({ delta }) => delta)),
    u16(...rangeOffsets),
    u16(...glyphIds),
  ]);

  return Buffer.concat([u16(4, 14 + body.length, 0, segments.length * 2, 0, 0, 0), body]);
};

/** Подтаблица формата 12: группы `[первый код, последний код, первый глиф]`. */
const cmapFormat12 = (groups: [number, number, number][]) =>
  Buffer.concat([u16(12, 0), u32(16 + groups.length * 12, 0, groups.length), ...groups.map((group) => u32(...group))]);

/** Шрифт sfnt из одной таблицы `cmap` с подтаблицами в порядке записей. */
const sfntWithCmap = (subtables: { platformId: number; encodingId: number; data: Buffer }[]) => {
  let offset = 4 + subtables.length * 8;
  const records = subtables.map(({ platformId, encodingId, data }) => {
    const record = Buffer.concat([u16(platformId, encodingId), u32(offset)]);

    offset += data.length;

    return record;
  });
  const cmap = Buffer.concat([u16(0, subtables.length), ...records, ...subtables.map(({ data }) => data)]);

  return Buffer.concat([
    u32(0x00010000),
    u16(1, 16, 0, 0),
    Buffer.from('cmap', 'latin1'),
    u32(0, 28, cmap.length),
    cmap,
  ]);
};

const code = (char: string) => char.codePointAt(0) ?? 0;

const single = (char: string) =>
  cmapFormat4([
    { start: code(char), end: code(char), delta: 1 - code(char) },
    { start: 0xffff, end: 0xffff, delta: 1 },
  ]);

describe('разбор cmap на синтетических шрифтах', () => {
  it('КОГДА формат 4 с сегментами через idRangeOffset и idDelta ТОГДА знаки с глифом, коды с глифом 0 и 0xFFFF — нет', () => {
    const font = sfntWithCmap([
      {
        platformId: 3,
        encodingId: 1,
        data: cmapFormat4([
          { start: code('A'), end: code('C'), delta: 0, glyphs: [5, 0, 7] },
          { start: code('D'), end: code('E'), delta: -code('D') },
          { start: 0xffff, end: 0xffff, delta: 1 },
        ]),
      },
    ]);

    expect([...readCharacters(font)].sort()).toEqual(['A', 'C', 'E']);
  });

  it('КОГДА формат 12 ТОГДА знаки вне BMP целиком, код группы с глифом 0 — нет', () => {
    const font = sfntWithCmap([
      {
        platformId: 3,
        encodingId: 10,
        data: cmapFormat12([
          [0x10, 0x10, 0],
          [0x1f600, 0x1f601, 10],
        ]),
      },
    ]);

    expect([...readCharacters(font)].sort()).toEqual(['😀', '😁']);
  });

  it('КОГДА подтаблиц несколько ТОГДА 3/10 лучше 3/1, 3/1 лучше 0/*, а одна Macintosh 1/0 — исключение', () => {
    const unicodeAndWindows = sfntWithCmap([
      { platformId: 0, encodingId: 3, data: single('X') },
      { platformId: 3, encodingId: 1, data: single('Y') },
    ]);
    const withFull = sfntWithCmap([
      { platformId: 0, encodingId: 3, data: single('X') },
      { platformId: 3, encodingId: 1, data: single('Y') },
      { platformId: 3, encodingId: 10, data: cmapFormat12([[code('Z'), code('Z'), 1]]) },
    ]);
    const macOnly = sfntWithCmap([{ platformId: 1, encodingId: 0, data: single('M') }]);

    expect([...readCharacters(unicodeAndWindows)]).toEqual(['Y']);
    expect([...readCharacters(withFull)]).toEqual(['Z']);
    expect(() => readCharacters(macOnly)).toThrow();
  });
});

describe('код выхода проверки', () => {
  const config = {
    admin: { user: 'users' },
    collections: [{ slug: 'zones', fields: [{ name: 'description', type: 'textarea' }] }],
    globals: [],
  } as unknown as SanitizedConfig;

  const sourceWith = (text: string): CmsSource => ({
    find: async () => [{ id: 7, description: text }],
    findGlobal: async () => ({}),
  });

  it('КОГДА в тексте знак вне GLYPHS ТОГДА код 1 и находка с путем поля', async () => {
    const { code: exit, report } = await runCheck(sourceWith('Проверка ✓'), config, fontSets());

    expect([exit, report.findings.map(({ char, paths }) => [char, paths])]).toEqual([
      1,
      [['✓', ['zones/7.description']]],
    ]);
  });

  it('КОГДА знака нет только в ponomar.woff2 ТОГДА код 0, предупреждение есть', async () => {
    const { code: exit, report } = await runCheck(sourceWith('Дом № 3'), config, fontSets({ ponomar: without('№') }));

    expect([exit, report.findings, report.warnings.map(({ char }) => char)]).toEqual([0, [], ['№']]);
  });

  it('КОГДА все знаки покрыты ТОГДА код 0 и текст прочитан', async () => {
    const { code: exit, texts } = await runCheck(sourceWith('Проверочная площадка'), config, fontSets());

    expect([exit, texts]).toEqual([0, [{ path: 'zones/7.description', text: 'Проверочная площадка' }]]);
  });
});
