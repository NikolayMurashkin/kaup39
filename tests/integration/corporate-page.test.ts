import config from '@payload-config';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getPayload, type CollectionSlug, type Payload } from 'payload';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getCorporatePage } from '@/cms/corporate';
import { DEFAULT_MEDIA_DIR, MEDIA_DIR } from '@/cms/consts';
import type { Page, User } from '@/payload-types';
import { CORPORATE } from '../e2e/seed/data';

type Section = NonNullable<Page['sections']>[number];

/** Отзыв так, как его читает тест: коллекции еще может не быть в сгенерированных типах. */
type ReviewDoc = { id: number | string; author: string; text: string; occasion?: string | null };

const REVIEWS = 'reviews' as CollectionSlug;

/** Проверочные данные теста — не контент владельцев. */
const PHOTOS = ['corporate-page-1.jpg', 'corporate-page-2.jpg'];
const PHOTOS_DIR = path.join(tmpdir(), 'kaup39-corporate-page-test');

const SITE = {
  name: 'Проверочное поселение страницы корпоративов',
  address: 'Проверочная область, 4 км от проверочного поселка',
  phone: '8 (000) 77-88-99',
  email: 'corporate-page@example.com',
};

const REVIEW = { author: 'Проверочный гость', text: 'Проверочный отзыв о празднике.', occasion: 'Корпоратив' };

const ADMIN = { email: 'corporate-reviews@kaup39.test', password: 'corporate-reviews-password' };

let payload: Payload;
let admin: User;
const mediaIds: number[] = [];

const removePage = () => payload.delete({ collection: 'pages', where: { slug: { equals: 'corporate' } } });

const removeReviews = async () => {
  if (hasReviews()) {
    await payload.delete({ collection: REVIEWS, where: { id: { exists: true } } });
  }
};

const hasReviews = () => payload.config.collections.some((collection) => collection.slug === REVIEWS);

const expectReviewsCollection = () =>
  expect(
    payload.config.collections.map((collection) => collection.slug),
    'коллекции reviews нет в конфиге Payload',
  ).toContain(REVIEWS);

/** Страница корпоративов из засева и раздел фото мероприятий с двумя проверочными кадрами. */
const createCorporate = async () => {
  await removePage();

  const sections: Section[] = [
    ...(CORPORATE.sections as Section[]),
    { blockType: 'photos', anchor: 'corporate-photos', heading: 'Проверочные фото мероприятий', photos: mediaIds },
  ];

  return payload.create({ collection: 'pages', data: { ...CORPORATE, sections } });
};

const photosOf = (page: Page | null | undefined) =>
  (
    (page?.sections ?? []).find(
      (section) => section.anchor === 'corporate-photos' && section.blockType === 'photos',
    ) as Extract<Section, { blockType: 'photos' }> | undefined
  )?.photos ?? [];

/** Отказ Local API: ошибка со статусом или `null`, если операция прошла. */
const failureOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => error,
  );

beforeAll(async () => {
  // тест пишет файлы в медиатеку: у тестов она своя, каталог владельцев трогать нельзя
  expect(path.resolve(MEDIA_DIR)).not.toBe(path.resolve(DEFAULT_MEDIA_DIR));
  mkdirSync(PHOTOS_DIR, { recursive: true });

  for (const [index, file] of PHOTOS.entries()) {
    await sharp({ create: { width: 320, height: 200, channels: 3, background: { r: 90, g: 40 * index, b: 30 } } })
      .jpeg()
      .toFile(path.join(PHOTOS_DIR, file));
  }

  payload = await getPayload({ config });

  for (const [index, file] of PHOTOS.entries()) {
    const media = await payload.create({
      collection: 'media',
      data: { alt: `Проверочный кадр мероприятия ${index + 1}` },
      filePath: path.join(PHOTOS_DIR, file),
    });

    mediaIds.push(media.id);
  }

  await payload.updateGlobal({ slug: 'site', data: SITE });
  await payload.delete({ collection: 'users', where: { email: { equals: ADMIN.email } } });
  admin = await payload.create({ collection: 'users', data: ADMIN });
});

beforeEach(async () => {
  await removeReviews();
});

afterAll(async () => {
  await removePage();
  await removeReviews();
  await payload.delete({ collection: 'users', where: { email: { equals: ADMIN.email } } });

  for (const id of mediaIds) {
    await payload.delete({ collection: 'media', id });
  }

  await payload.destroy();
  rmSync(PHOTOS_DIR, { recursive: true, force: true });
});

describe('данные страницы корпоративов', () => {
  it('страница из засева с раскрытыми кадрами мероприятий, телефон владельцев из глобала, отзывов нет — пустой список', async () => {
    await createCorporate();

    const data = await getCorporatePage();

    expect(data.page?.slug).toBe('corporate');

    const photos = photosOf(data.page);

    expect(photos).toHaveLength(PHOTOS.length);

    for (const photo of photos) {
      expect(typeof photo).toBe('object');
      expect(typeof photo === 'object' ? photo.url : null).toEqual(expect.stringMatching(/^\/api\/media\/file\//));
    }

    expect(data.site).toMatchObject(SITE);
    expect(data.site.phone).toBe(SITE.phone);
    expect(data.reviews).toEqual([]);
  });

  it('отзыв, созданный в админке, виден со следующего чтения; удален — снова пустой список', async () => {
    expectReviewsCollection();
    await createCorporate();

    const created = (await payload.create({ collection: REVIEWS, data: REVIEW as never })) as unknown as ReviewDoc;

    expect((await getCorporatePage()).reviews).toEqual([expect.objectContaining(REVIEW)]);

    await payload.delete({ collection: REVIEWS, id: created.id });

    expect((await getCorporatePage()).reviews).toEqual([]);
  });

  it('права отзывов: аноним читает, но не создает и не правит; пользователь админки создает', async () => {
    expectReviewsCollection();

    const created = (await payload.create({ collection: REVIEWS, data: REVIEW as never })) as unknown as ReviewDoc;
    const read = await payload.find({ collection: REVIEWS, overrideAccess: false });

    expect(read.docs).toEqual([expect.objectContaining(REVIEW)]);

    expect(
      await failureOf(
        payload.create({
          collection: REVIEWS,
          data: { author: 'Аноним', text: 'Отзыв без входа' } as never,
          overrideAccess: false,
        }),
      ),
      'аноним создал отзыв',
    ).toMatchObject({ status: 403 });
    expect(
      await failureOf(
        payload.update({
          collection: REVIEWS,
          id: created.id,
          data: { text: 'Правка без входа' } as never,
          overrideAccess: false,
        }),
      ),
      'аноним поправил отзыв',
    ).toMatchObject({ status: 403 });
    expect(((await payload.findByID({ collection: REVIEWS, id: created.id })) as unknown as ReviewDoc).text).toBe(
      REVIEW.text,
    );

    const byAdmin = (await payload.create({
      collection: REVIEWS,
      data: { author: 'Гость из админки', text: 'Отзыв из админки' } as never,
      overrideAccess: false,
      user: admin,
    })) as unknown as ReviewDoc;

    expect(byAdmin).toMatchObject({ author: 'Гость из админки', text: 'Отзыв из админки' });
    expect((await payload.count({ collection: REVIEWS })).totalDocs).toBe(2);
  });

  it('страницы корпоративов нет — page равен null, site — глобал', async () => {
    await removePage();

    const data = await getCorporatePage();

    expect(data.page).toBeNull();
    expect(data.site).toMatchObject(SITE);
  });
});
