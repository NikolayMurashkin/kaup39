import config from '@payload-config';
import { join } from 'node:path';
import { getPayload, type Payload, type SanitizedConfig } from 'payload';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type CmsSource,
  fontCharacters,
  type GlyphSets,
  localSource,
  missingGlyphs,
  readCms,
} from '../../scripts/cms-glyphs.mts';
import { GLYPHS } from '../../scripts/subset-glyphs.mts';
import { FONTS_DIR } from '../lib/files';

/** Проверочные тексты теста — не контент владельцев. Знак «✓» в набор сабсета не входит. */
const BROKEN = 'Проверочная площадка у воды ✓';
const FIXED = 'Проверочная площадка у воды';

const SITE = {
  name: 'Проверочное поселение проверки знаков',
  address: 'Проверочная область, проверочный поселок',
  phone: '8 (000) 77-88-99',
  email: 'cms-glyphs@example.com',
};

let payload: Payload;
let sanitized: SanitizedConfig;
let sets: GlyphSets;
let zoneId: number | string;
let pageId: number | string;

const fontFile = async (file: string) => ({ file, chars: await fontCharacters(join(FONTS_DIR, file)) });

const removeDirections = () =>
  payload.delete({ collection: 'pages', where: { slug: { equals: 'directions' } }, overrideAccess: true });

const pageData = (text: string) => ({
  title: 'Проверочная страница проверки знаков',
  slug: 'directions' as const,
  sections: [
    {
      blockType: 'list' as const,
      heading: 'Проверочный список',
      items: [{ title: 'Первый пункт' }, { title: 'Второй пункт', text }],
    },
  ],
});

const siteData = (text: string) => ({
  ...SITE,
  refund: { title: 'Проверочный возврат', details: [{ text: 'Номер заказа' }, { text }] },
});

const report = async () => missingGlyphs(await readCms(localSource(payload), sanitized), sets);

const checkPaths = async () => (await report()).findings.find(({ char }) => char === '✓')?.paths ?? ([] as string[]);

beforeAll(async () => {
  payload = await getPayload({ config });
  sanitized = await config;
  sets = {
    glyphs: GLYPHS,
    required: [await fontFile('golos-text.woff2')],
    optional: [await fontFile('ponomar.woff2'), await fontFile('forum.woff2')],
  };

  await payload.delete({ collection: 'zones', where: { slug: { equals: 'proverka-znakov' } } });
  await removeDirections();

  zoneId = (
    await payload.create({
      collection: 'zones',
      data: { name: 'Проверочная площадка', slug: 'proverka-znakov', description: BROKEN, order: 0 },
    })
  ).id;
  pageId = (await payload.create({ collection: 'pages', data: pageData(BROKEN) })).id;
  await payload.updateGlobal({ slug: 'site', data: siteData(BROKEN) });
});

afterAll(async () => {
  await payload.delete({ collection: 'zones', where: { slug: { equals: 'proverka-znakov' } } });
  await removeDirections();
  await payload.destroy();
});

describe('знаки текстов CMS по базе', () => {
  it('КОГДА в поле зоны записан текст со знаком вне набора ТОГДА в findings этот знак с путем поля этой зоны', async () => {
    expect(await checkPaths()).toContain(`zones/${zoneId}.description`);
  });

  it('КОГДА знак во вложенном поле глобала site ТОГДА путь globals/site.<путь>', async () => {
    expect(await checkPaths()).toContain('globals/site.refund.details[1].text');
  });

  it('КОГДА знак во вложенном массиве раздела страницы ТОГДА полный путь до элемента массива', async () => {
    expect(await checkPaths()).toContain(`pages/${pageId}.sections[0].items[1].text`);
  });

  it('КОГДА знак исправлен ТОГДА findings пусто', async () => {
    expect(await checkPaths()).toContain(`zones/${zoneId}.description`);

    await payload.update({ collection: 'zones', id: zoneId, data: { description: FIXED } });
    await payload.update({ collection: 'pages', id: pageId, data: pageData(FIXED) });
    await payload.updateGlobal({ slug: 'site', data: siteData(FIXED) });

    expect((await report()).findings).toEqual([]);
  });

  it('readCms читает каждую коллекцию конфига, кроме users и служебных, и каждый глобал', async () => {
    const collections: string[] = [];
    const globals: string[] = [];
    const inner = localSource(payload);
    const recording: CmsSource = {
      find: (slug) => {
        collections.push(slug);

        return inner.find(slug);
      },
      findGlobal: (slug) => {
        globals.push(slug);

        return inner.findGlobal(slug);
      },
    };

    await readCms(recording, sanitized);

    const expected = sanitized.collections
      .map(({ slug }) => slug)
      .filter((slug) => slug !== 'users' && !slug.startsWith('payload-'));

    expect([...new Set(collections)].sort()).toEqual([...expected].sort());
    expect([...new Set(globals)].sort()).toEqual(sanitized.globals.map(({ slug }) => slug).sort());
  });
});
