/**
 * Проверка знаков текстов CMS: каждый знак, который покажет страница, есть в наборе сабсета `GLYPHS` и в файле
 * текстовой гарнитуры, иначе браузер отрисует его запасной. Читает базу целиком — с текстами, набранными
 * в админке руками, которых не видят ни проверка файла контента при импорте, ни тест `font-subset`.
 * CLI — `scripts/check-cms-glyphs.ts`.
 */
import { readFile } from 'node:fs/promises';
import fontverter from 'fontverter';
import type { CollectionSlug, Field, GlobalSlug, Payload, SanitizedConfig } from 'payload';
import { readCharacters } from './sfnt-cmap.mts';

/** Текст поля CMS и путь до него: `<коллекция>/<id>.<путь поля>` или `globals/<slug>.<путь>`. */
export type CmsText = { path: string; text: string };

/** Знаки одного файла шрифта. */
export type FontChars = { file: string; chars: Set<string> };

/** Знак, которого нет в наборе сабсета или в файле шрифта, и поля, где он стоит. */
export type GlyphProblem = { char: string; codePoint: string; paths: string[]; missing: string[] };

export type GlyphReport = { findings: GlyphProblem[]; warnings: GlyphProblem[] };

/**
 * С чем сверяются знаки: `required` — без знака в файле текст уйдет в запасную гарнитуру (находка),
 * `optional` — гарнитуры заголовков и капители, где пробелы известны (предупреждение).
 */
export type GlyphSets = { glyphs: string; required: FontChars[]; optional: FontChars[] };

/** Откуда читаются документы: REST стенда или Local API. */
export type CmsSource = {
  find: (slug: string) => Promise<unknown[]>;
  findGlobal: (slug: string) => Promise<unknown>;
};

/** Переводы строк и табуляция в `textarea` — разметка текста, а не знаки шрифта. */
const LAYOUT_CHARS = new Set(['\n', '\r', '\t']);

/** Служебные коллекции Payload: настройки админки, миграции, блокировки документов. */
const SERVICE_PREFIX = 'payload-';

const GLYPHS_SET = 'GLYPHS';

const LOGIN_PATH = '/api/users/login';

type Doc = Record<string, unknown>;

const isDoc = (value: unknown): value is Doc => typeof value === 'object' && value !== null && !Array.isArray(value);

const textsOf = (path: string, value: unknown): CmsText[] => {
  if (typeof value === 'string') return value === '' ? [] : [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => textsOf(`${path}[${index}]`, item));

  return [];
};

const rowsOf = (value: unknown) => (Array.isArray(value) ? value.filter(isDoc) : []);

/**
 * Все непустые тексты полей `text` и `textarea` документа на любой глубине: `array`, `group`, `row`,
 * `collapsible`, `tabs`, `blocks` (поля блока — по его `blockType`). Путь — `prefix` и имена полей
 * через точку, номер элемента — в квадратных скобках.
 */
export const collectTexts = (fields: Field[], doc: unknown, prefix: string): CmsText[] => {
  if (!isDoc(doc)) return [];

  return fields.flatMap((field): CmsText[] => {
    switch (field.type) {
      case 'text':
      case 'textarea':
        return textsOf(`${prefix}.${field.name}`, doc[field.name]);
      case 'group':
        return 'name' in field && field.name
          ? collectTexts(field.fields, doc[field.name], `${prefix}.${field.name}`)
          : collectTexts(field.fields, doc, prefix);
      case 'row':
      case 'collapsible':
        return collectTexts(field.fields, doc, prefix);
      case 'tabs':
        return field.tabs.flatMap((tab) =>
          'name' in tab && tab.name
            ? collectTexts(tab.fields, doc[tab.name], `${prefix}.${tab.name}`)
            : collectTexts(tab.fields, doc, prefix),
        );
      case 'array':
        return rowsOf(doc[field.name]).flatMap((row, index) =>
          collectTexts(field.fields, row, `${prefix}.${field.name}[${index}]`),
        );
      case 'blocks':
        return rowsOf(doc[field.name]).flatMap((row, index) => {
          const block = field.blocks.find(({ slug }) => slug === row.blockType);

          return block ? collectTexts(block.fields, row, `${prefix}.${field.name}[${index}]`) : [];
        });
      default:
        return [];
    }
  });
};

const codePointOf = (char: string) => `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`;

const lacking = (char: string, fonts: FontChars[]) =>
  fonts.filter(({ chars }) => !chars.has(char)).map(({ file }) => file);

/**
 * Знаки текстов, которых нет в наборе или в файлах шрифтов. Знак — кодовая точка (эмодзи — одна, не две
 * половинки суррогатной пары), у каждого — все поля, где он стоит. `findings` — знака нет в `GLYPHS`
 * или в файле из `required`; `warnings` — с ними все в порядке, но нет в файле из `optional`.
 */
export const missingGlyphs = (texts: CmsText[], { glyphs, required, optional }: GlyphSets): GlyphReport => {
  const glyphSet = new Set(glyphs);
  const places = new Map<string, string[]>();

  texts.forEach(({ path, text }) => {
    new Set([...text].filter((char) => !LAYOUT_CHARS.has(char))).forEach((char) => {
      const paths = places.get(char) ?? [];

      if (!paths.includes(path)) paths.push(path);
      places.set(char, paths);
    });
  });

  const findings: GlyphProblem[] = [];
  const warnings: GlyphProblem[] = [];

  places.forEach((paths, char) => {
    const problem = { char, codePoint: codePointOf(char), paths };
    const missing = [...(glyphSet.has(char) ? [] : [GLYPHS_SET]), ...lacking(char, required)];

    if (missing.length > 0) {
      findings.push({ ...problem, missing });

      return;
    }

    const optionalGaps = lacking(char, optional);

    if (optionalGaps.length > 0) warnings.push({ ...problem, missing: optionalGaps });
  });

  return { findings, warnings };
};

/** Знаки из таблицы `cmap` файла `.woff2`: распаковка в sfnt — тем же `fontverter`, что пакует сабсеты. */
export const fontCharacters = async (file: string) =>
  readCharacters(await fontverter.convert(await readFile(file), 'sfnt'));

const problemLines = ({ char, codePoint, paths, missing }: GlyphProblem, mark: string) => {
  const gaps = missing.map((source) => `нет в ${source}`).join(', ');

  return paths.map((path) => `${mark}«${char}» ${codePoint} — ${gaps}: ${path}`);
};

/** Строки вывода: на каждое поле знака своя строка, предупреждения — с пометкой. */
export const formatReport = ({ findings, warnings }: GlyphReport) => [
  ...findings.flatMap((problem) => problemLines(problem, '')),
  ...warnings.flatMap((problem) => problemLines(problem, 'предупреждение: ')),
];

/**
 * Тексты всех коллекций и глобалов конфига, кроме пользователей админки и служебных коллекций Payload:
 * новая коллекция попадает в проверку сама.
 */
export const readCms = async (source: CmsSource, config: SanitizedConfig) => {
  const collections = config.collections.filter(
    ({ slug }) => slug !== config.admin.user && !slug.startsWith(SERVICE_PREFIX),
  );
  const texts: CmsText[] = [];

  for (const { slug, fields } of collections) {
    const docs = await source.find(slug);

    docs.forEach((doc) => texts.push(...collectTexts(fields, doc, `${slug}/${isDoc(doc) ? String(doc.id) : '?'}`)));
  }

  for (const { slug, fields } of config.globals) {
    texts.push(...collectTexts(fields, await source.findGlobal(slug), `globals/${slug}`));
  }

  return texts;
};

/**
 * Проверка целиком: тексты из источника против набора и шрифтов. Код 1 — есть хоть одна находка,
 * предупреждения код не меняют: пробелы заголовочных гарнитур известны и не ведут к запасному шрифту текста.
 */
export const runCheck = async (
  source: CmsSource,
  config: SanitizedConfig,
  sets: GlyphSets,
): Promise<{ texts: CmsText[]; report: GlyphReport; code: 0 | 1 }> => {
  const texts = await readCms(source, config);
  const report = missingGlyphs(texts, sets);

  return { texts, report, code: report.findings.length === 0 ? 0 : 1 };
};

const responseError = async (response: Response) => {
  const body = await response.text().catch(() => '');

  return `${response.status} ${response.statusText}${body ? ` ${body.slice(0, 200)}` : ''}`.trim();
};

/**
 * Чтение через REST админки: вход пользователем админки, затем каждый документ с глубиной 0 и без пагинации.
 * Любой отказ — исключение: пропущенная молча коллекция дала бы ложное «знаков не хватает: 0».
 */
export const restSource = async (
  baseUrl: string,
  email: string,
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsSource> => {
  const login = await fetchImpl(new URL(LOGIN_PATH, baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!login.ok) throw new Error(`не удалось войти в админку ${baseUrl}: ${await responseError(login)}`);

  const { token } = (await login.json()) as { token?: string };

  if (!token) throw new Error(`не удалось войти в админку ${baseUrl}: в ответе нет токена`);

  const get = async (path: string, name: string, query: Record<string, string>) => {
    const url = new URL(path, baseUrl);

    url.search = new URLSearchParams(query).toString();

    const response = await fetchImpl(url, { headers: { Authorization: `JWT ${token}` } });

    if (!response.ok) throw new Error(`${name}: чтение не удалось, ${await responseError(response)}`);

    return response.json() as Promise<unknown>;
  };

  return {
    find: async (slug) => {
      const body = await get(`/api/${slug}`, slug, { depth: '0', pagination: 'false' });

      if (!isDoc(body) || !Array.isArray(body.docs)) throw new Error(`${slug}: в ответе нет списка docs`);

      return body.docs;
    },
    findGlobal: (slug) => get(`/api/globals/${slug}`, `globals/${slug}`, { depth: '0' }),
  };
};

/** Чтение через Local API — как видит базу админка, без проверки доступа. */
export const localSource = (payload: Payload): CmsSource => ({
  find: async (slug) =>
    (
      await payload.find({
        collection: slug as CollectionSlug,
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })
    ).docs,
  findGlobal: (slug) => payload.findGlobal({ slug: slug as GlobalSlug, depth: 0, overrideAccess: true }),
});
