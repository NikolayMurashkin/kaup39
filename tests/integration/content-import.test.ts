import config from '@payload-config';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_MEDIA_DIR, MEDIA_DIR } from '@/cms/consts';
import type { Media, Page } from '@/payload-types';
import type { Album, Media as MediaDoc, Zone } from '../lib/albums';
import { importContent } from '../../scripts/content-import.mts';
import type {
  ContentAlbum,
  ContentFile,
  ContentPage,
  ContentSection,
  PhotoRegistry,
} from '../../scripts/content-types';

/** Проверочный контент: тексты и кадры придуманы для теста, события названы slug из `facts.ts` — к ним импорт берет цены. */
const PHOTOS = ['import-1.jpg', 'import-2.jpg', 'import-3.jpg'];
const PHOTOS_DIR = path.join(tmpdir(), 'kaup39-import-test');

const CAMPING: ContentSection[] = [
  { blockType: 'text', anchor: 'camping', heading: 'Проверочный кемпинг', body: 'Ночевка в палатках.' },
  { blockType: 'prices', anchor: 'camping-prices', rows: [{ label: 'Место', amount: 2000 }] },
  { blockType: 'list', anchor: 'camping-services', items: [{ title: 'Дрова' }] },
];

const RENT: ContentSection[] = [
  { blockType: 'text', anchor: 'rent', heading: 'Проверочная аренда', body: 'Поселение целиком.' },
  { blockType: 'prices', anchor: 'rent-prices', rows: [{ label: 'Аренда', amount: 5000, unit: 'час' }] },
];

const HOME_SECTIONS: ContentSection[] = [
  { blockType: 'text', anchor: 'about', heading: 'О поселении', body: 'Проверочный текст.' },
  { blockType: 'photos', anchor: 'gallery', photos: PHOTOS },
];

const content = (pages: ContentPage[]): ContentFile => ({
  site: {
    name: 'Проверочное поселение',
    address: 'Проверочный адрес',
    phone: '8 (000) 00-00-00',
    email: 'test@example.com',
    socials: [],
    refund: { title: 'Возврат', body: 'Условия возврата.', email: 'refund@example.com', details: ['Номер заказа'] },
  },
  media: PHOTOS.map((file, index) => ({ file, alt: `Проверочный кадр ${index + 1}` })),
  events: [
    { slug: 'denvikingi', title: 'Проверочный день', photo: PHOTOS[0] },
    { slug: 'ragnarek', title: 'Проверочный вечер' },
  ],
  zones: [{ slug: 'proverka-zona', name: 'Проверочная площадка', mark: 'house', order: 1, photo: PHOTOS[1] }],
  taverns: [
    {
      slug: 'proverka-taverna',
      name: 'Проверочная таверна',
      order: 1,
      photo: PHOTOS[2],
      menu: [{ items: [{ name: 'Похлебка', price: 350 }] }],
    },
  ],
  pages,
});

/** Раскладка до переноса: кемпинг и аренда — разделы главной, у корпоративов своих разделов аренды нет. */
const BEFORE = content([
  {
    slug: 'home',
    title: 'Главная',
    hero: { photoNight: PHOTOS[0] },
    sections: [...HOME_SECTIONS, ...CAMPING, ...RENT],
  },
  { slug: 'corporate', title: 'Корпоративы', sections: [] },
]);

/** Раскладка после: кемпинг — своя страница, аренда — у корпоративов, у страниц тизеры для главной. */
const AFTER = content([
  { slug: 'home', title: 'Главная', hero: { photoNight: PHOTOS[0] }, sections: HOME_SECTIONS },
  {
    slug: 'camping',
    title: 'Кемпинг',
    teaser: { title: 'Ночь в поселении', text: 'Место под палатку.', action: 'Цены', photo: PHOTOS[2] },
    sections: CAMPING,
  },
  {
    slug: 'corporate',
    title: 'Корпоративы',
    teaser: { title: 'Поселение целиком', text: 'Длинный дом.', action: 'Форматы и заявка' },
    sections: RENT,
  },
]);

const REGISTRY: PhotoRegistry = {
  photos: PHOTOS.map((file) => ({
    file,
    source: 'https://kaup39.ru/proverka',
    author: 'Проверочный фотограф',
    basis: 'owners',
    subject: 'Проверочный кадр',
    slots: [],
  })),
  noPhoto: [],
  noBetterPhoto: [],
};

let payload: Payload;

const pageOf = async (slug: Page['slug']) =>
  (await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, depth: 1 })).docs;

const anchors = (page: Page | undefined) => (page?.sections ?? []).map((section) => section.anchor);

const filename = (media: number | Media | null | undefined) => (typeof media === 'object' ? media?.filename : null);

/** `AFTER` с альбомами и галереей зоны: порядок альбомов в файле — их `order`. */
const withAlbums = (albums: ContentAlbum[], zoneGallery: string[], media = AFTER.media): ContentFile => ({
  ...AFTER,
  media,
  albums,
  zones: AFTER.zones.map((zone) => ({ ...zone, gallery: zoneGallery })),
});

const ALBUMS: ContentAlbum[] = [
  { slug: 'proverka-1', title: 'Первый альбом', photos: [PHOTOS[2], PHOTOS[0]] },
  { slug: 'proverka-2', title: 'Второй альбом', photos: [PHOTOS[1]] },
];

const albumDocs = async () =>
  (await payload.find({ collection: 'albums', sort: 'order', depth: 1, pagination: false })).docs;

const albumFiles = (album: Album | undefined) => (album?.photos ?? []).map((photo) => filename(photo));

const zoneDoc = async () =>
  (await payload.find({ collection: 'zones', where: { slug: { equals: 'proverka-zona' } }, depth: 1 })).docs[0] as
    Zone | undefined;

/** Счетчик коллекции из отчета импорта: `albums` входит в него вместе с остальными. */
const counted = (report: object, collection: string) => (report as Record<string, number>)[collection];

beforeAll(async () => {
  // импорт пишет файлы в медиатеку: у теста она своя, каталог владельцев стирать нельзя
  expect(path.resolve(MEDIA_DIR)).not.toBe(path.resolve(DEFAULT_MEDIA_DIR));
  rmSync(MEDIA_DIR, { recursive: true, force: true });
  mkdirSync(PHOTOS_DIR, { recursive: true });

  for (const [index, file] of PHOTOS.entries()) {
    await sharp({ create: { width: 320, height: 200, channels: 3, background: { r: 60 * index, g: 90, b: 120 } } })
      .jpeg()
      .toFile(path.join(PHOTOS_DIR, file));
  }

  payload = await getPayload({ config });
});

afterAll(async () => {
  await payload.destroy();
  rmSync(MEDIA_DIR, { recursive: true, force: true });
  rmSync(PHOTOS_DIR, { recursive: true, force: true });
});

describe('импорт контента', () => {
  it('кемпинг переезжает на свою страницу, аренда — к корпоративам, повторный запуск не плодит дублей', async () => {
    const before = await importContent(payload, BEFORE, REGISTRY, PHOTOS_DIR);

    expect(anchors((await pageOf('home'))[0])).toEqual([
      'about',
      'gallery',
      'camping',
      'camping-prices',
      'camping-services',
      'rent',
      'rent-prices',
    ]);

    const after = await importContent(payload, AFTER, REGISTRY, PHOTOS_DIR);
    const again = await importContent(payload, AFTER, REGISTRY, PHOTOS_DIR);

    expect(after).toEqual({ ...before, pages: before.pages + 1 });
    expect(again).toEqual(after);
    expect(await pageOf('home')).toHaveLength(1);
    expect(anchors((await pageOf('home'))[0])).toEqual(['about', 'gallery']);
    expect(await pageOf('camping')).toHaveLength(1);
    expect(anchors((await pageOf('camping'))[0])).toEqual(['camping', 'camping-prices', 'camping-services']);
    expect(anchors((await pageOf('corporate'))[0])).toEqual(['rent', 'rent-prices']);
  });

  it('кадры карточек площадки, таверны, события и тизера страницы привязаны к медиатеке', async () => {
    await importContent(payload, AFTER, REGISTRY, PHOTOS_DIR);

    const one = async (collection: 'events' | 'zones' | 'taverns', slug: string) =>
      (await payload.find({ collection, where: { slug: { equals: slug } }, depth: 1 })).docs[0];

    expect(filename((await one('events', 'denvikingi'))?.photo)).toBe(PHOTOS[0]);
    expect(filename((await one('zones', 'proverka-zona'))?.photo)).toBe(PHOTOS[1]);
    expect(filename((await one('taverns', 'proverka-taverna'))?.photo)).toBe(PHOTOS[2]);

    const [camping] = await pageOf('camping');
    const [corporate] = await pageOf('corporate');

    expect(camping.teaser).toMatchObject({ title: 'Ночь в поселении', text: 'Место под палатку.', action: 'Цены' });
    expect(filename(camping.teaser?.photo)).toBe(PHOTOS[2]);
    expect(corporate.teaser).toMatchObject({ title: 'Поселение целиком', action: 'Форматы и заявка' });
  });

  it('альбомы и галерея зоны раскладываются из файла, повторный запуск не плодит дублей и не дописывает кадры', async () => {
    const file = withAlbums(ALBUMS, [PHOTOS[1], PHOTOS[2]]);
    const first = await importContent(payload, file, REGISTRY, PHOTOS_DIR);
    const again = await importContent(payload, file, REGISTRY, PHOTOS_DIR);
    const albums = await albumDocs();

    expect(again).toEqual(first);
    expect(counted(again, 'albums')).toBe(2);
    expect(albums.map((album) => album.slug)).toEqual(['proverka-1', 'proverka-2']);
    expect(albums.map((album) => album.title)).toEqual(['Первый альбом', 'Второй альбом']);
    expect(albums.map((album) => album.order)).toEqual([1, 2]);
    expect(albumFiles(albums[0])).toEqual([PHOTOS[2], PHOTOS[0]]);
    expect(albumFiles(albums[1])).toEqual([PHOTOS[1]]);
    expect((await zoneDoc())?.gallery?.map((photo) => filename(photo))).toEqual([PHOTOS[1], PHOTOS[2]]);

    const first0 = new Set(albumFiles(albums[0]));

    expect(albumFiles(albums[1]).filter((name) => first0.has(name))).toEqual([]);
  });

  it('правка состава альбома в файле заменяет список кадров, а не дописывает', async () => {
    await importContent(payload, withAlbums(ALBUMS, [PHOTOS[1], PHOTOS[2]]), REGISTRY, PHOTOS_DIR);

    const moved: ContentAlbum[] = [
      { ...ALBUMS[0], photos: [PHOTOS[1]] },
      { ...ALBUMS[1], photos: [] },
    ];
    const report = await importContent(payload, withAlbums(moved, [PHOTOS[1], PHOTOS[2]]), REGISTRY, PHOTOS_DIR);
    const albums = await albumDocs();

    expect(counted(report, 'albums')).toBe(2);
    expect(albums.map((album) => album.slug)).toEqual(['proverka-1', 'proverka-2']);
    expect(albumFiles(albums[0])).toEqual([PHOTOS[1]]);
    expect(albumFiles(albums[1])).toEqual([]);
  });

  it('автор кадра из файла контента попадает в медиатеку', async () => {
    const media = AFTER.media.map((item, index) => (index === 0 ? { ...item, author: 'Проверочный фотограф' } : item));

    await importContent(payload, withAlbums(ALBUMS, [], media), REGISTRY, PHOTOS_DIR);

    const authorOf = async (file: string) =>
      (
        (await payload.find({ collection: 'media', where: { filename: { equals: file } }, limit: 1 })).docs[0] as
          MediaDoc | undefined
      )?.author;

    expect(await authorOf(PHOTOS[0])).toBe('Проверочный фотограф');
    expect((await authorOf(PHOTOS[1])) ?? null).toBeNull();
  });

  it('фото раздела car страницы «как доехать» — кадр из слота kak-doehat-parking реестра, повторный импорт ничего не плодит', async () => {
    const directions: ContentPage = {
      slug: 'directions',
      title: 'Как добраться',
      sections: [
        { blockType: 'text', anchor: 'car', heading: 'Самостоятельный проезд', body: 'Большая бесплатная парковка.' },
        { blockType: 'links', anchor: 'maps', links: [{ label: '2ГИС', url: 'https://2gis.ru/proverka' }] },
      ],
    };
    const file: ContentFile = { ...AFTER, pages: [...AFTER.pages, directions] };
    const registry: PhotoRegistry = {
      ...REGISTRY,
      photos: REGISTRY.photos.map((record) =>
        record.file === PHOTOS[1] ? { ...record, slots: ['kak-doehat-parking'] } : record,
      ),
    };
    const carOf = async () =>
      ((await pageOf('directions'))[0]?.sections ?? []).find((section) => section.anchor === 'car');
    const carFile = async () => {
      const car = await carOf();

      return car?.blockType === 'text' ? filename(car.photo) : null;
    };
    const mediaCount = async () => (await payload.find({ collection: 'media', limit: 1 })).totalDocs;

    const first = await importContent(payload, file, registry, PHOTOS_DIR);

    expect(await carFile()).toBe(PHOTOS[1]);

    const mediaBefore = await mediaCount();
    const again = await importContent(payload, file, registry, PHOTOS_DIR);

    expect(again).toEqual(first);
    expect(await pageOf('directions')).toHaveLength(1);
    expect(await carFile()).toBe(PHOTOS[1]);
    expect(await mediaCount()).toBe(mediaBefore);
  });
});
