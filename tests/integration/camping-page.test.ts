import config from '@payload-config';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { campingParts } from '@/app/(site)/kemping/parts';
import { getCampingPage } from '@/cms/camping';
import { DEFAULT_MEDIA_DIR, MEDIA_DIR } from '@/cms/consts';
import { validatePhone } from '@/cms/validate';
import type { Page } from '@/payload-types';
import { CAMPING, CAMPING_BOOKING } from '../e2e/seed/data';

type Section = NonNullable<Page['sections']>[number];

/** Раздел «Телефон» так, как его читает тест: номер и кому звонить. */
type PhoneSection = { blockType: string; phone?: string | null; person?: string | null };

/** Проверочные данные теста — не контент владельцев. */
const PHOTOS = ['camping-page-1.jpg', 'camping-page-2.jpg'];
const PHOTOS_DIR = path.join(tmpdir(), 'kaup39-camping-page-test');

const SITE = {
  name: 'Проверочное поселение страницы кемпинга',
  address: 'Проверочная область, 4 км от проверочного поселка',
  phone: '8 (000) 44-55-66',
  email: 'camping-page@example.com',
};

const NOT_A_PHONE = 'позвоните Анастасии';

/** Отказ Payload по номеру раздела «Телефон» с сообщением нашего валидатора, а не по другой причине. */
const PHONE_REJECTION = {
  data: {
    errors: [
      expect.objectContaining({
        path: expect.stringMatching(/^sections\.\d+\.phone$/),
        message: expect.stringContaining(String(validatePhone(NOT_A_PHONE))),
      }),
    ],
  },
};

const seeded = <Type extends Section['blockType']>(anchor: string, blockType: Type) =>
  CAMPING.sections.find((section) => section.anchor === anchor && section.blockType === blockType) as
    Extract<Section, { blockType: Type }> | undefined;

const SEED_ROWS = (seeded('camping-prices', 'prices')?.rows ?? []).map(({ label, amount, note }) => ({
  label,
  amount,
  note: note ?? null,
}));

const SEED_ITEMS = (seeded('camping-services', 'list')?.items ?? []).map(({ title, text, url }) => ({
  title,
  text: text ?? null,
  url: url ?? null,
}));

let payload: Payload;
const mediaIds: number[] = [];

/** Разделы засева и раздел фото кемпинга с двумя проверочными кадрами. */
const sectionsWith = (booking: Section = CAMPING_BOOKING as unknown as Section): Section[] => [
  ...CAMPING.sections.filter((section) => section.anchor !== CAMPING_BOOKING.anchor),
  booking,
  { blockType: 'photos', anchor: 'camping-photos', heading: 'Проверочные фото кемпинга', photos: mediaIds },
];

const removePage = (slug: Page['slug']) => payload.delete({ collection: 'pages', where: { slug: { equals: slug } } });

/** Страница кемпинга с нуля: прежнюю, оставленную другими файлами тестов, сначала снимаем. */
const createCamping = async (sections = sectionsWith()) => {
  await removePage('camping');

  return payload.create({ collection: 'pages', data: { ...CAMPING, sections } });
};

const firstAmount = async () => (campingParts((await getCampingPage()).page?.sections).prices?.rows ?? [])[0]?.amount;

const bookingOf = (page: Page | null | undefined) =>
  (page?.sections ?? []).find((section) => section.anchor === CAMPING_BOOKING.anchor) as PhoneSection | undefined;

beforeAll(async () => {
  // тест пишет файлы в медиатеку: у тестов она своя, каталог владельцев трогать нельзя
  expect(path.resolve(MEDIA_DIR)).not.toBe(path.resolve(DEFAULT_MEDIA_DIR));
  mkdirSync(PHOTOS_DIR, { recursive: true });

  for (const [index, file] of PHOTOS.entries()) {
    await sharp({ create: { width: 320, height: 200, channels: 3, background: { r: 40, g: 80 * index, b: 60 } } })
      .jpeg()
      .toFile(path.join(PHOTOS_DIR, file));
  }

  payload = await getPayload({ config });

  for (const [index, file] of PHOTOS.entries()) {
    const media = await payload.create({
      collection: 'media',
      data: { alt: `Проверочный кадр кемпинга ${index + 1}` },
      filePath: path.join(PHOTOS_DIR, file),
    });

    mediaIds.push(media.id);
  }

  await payload.updateGlobal({ slug: 'site', data: SITE });
  await removePage('directions');
});

afterAll(async () => {
  await removePage('camping');
  await removePage('directions');

  for (const id of mediaIds) {
    await payload.delete({ collection: 'media', id });
  }

  await payload.destroy();
  rmSync(PHOTOS_DIR, { recursive: true, force: true });
});

describe('данные страницы кемпинга', () => {
  it('страница из засева: цены, услуги и телефон бронирования совпадают с засевом, кадры раскрыты, site — глобал', async () => {
    await createCamping();

    const data = await getCampingPage();

    expect(data.page?.slug).toBe('camping');

    const parts = campingParts(data.page?.sections);

    expect(SEED_ROWS).toHaveLength(3);
    expect(
      (parts.prices?.rows ?? []).map(({ label, amount, note }) => ({ label, amount, note: note ?? null })),
    ).toEqual(SEED_ROWS);
    expect(
      (parts.services?.items ?? []).map(({ title, text, url }) => ({ title, text: text ?? null, url: url ?? null })),
    ).toEqual(SEED_ITEMS);

    const booking = parts.booking as PhoneSection | null;

    expect({ phone: booking?.phone, person: booking?.person }).toEqual({
      phone: CAMPING_BOOKING.phone,
      person: CAMPING_BOOKING.person,
    });

    const photos = parts.photos?.photos ?? [];

    expect(photos).toHaveLength(PHOTOS.length);

    for (const photo of photos) {
      expect(typeof photo).toBe('object');
      expect(typeof photo === 'object' ? photo.url : null).toEqual(expect.stringMatching(/^\/api\/media\/file\//));
    }

    expect(data.site).toMatchObject(SITE);
  });

  it('раздел цен с якорем кемпинга у страницы «как доехать» не подменяет цены кемпинга', async () => {
    await createCamping();
    await payload.create({
      collection: 'pages',
      data: {
        slug: 'directions',
        title: 'Проверочная дорога',
        sections: [
          {
            blockType: 'prices',
            anchor: 'camping-prices',
            heading: 'Чужие цены',
            rows: [{ label: 'Чужая строка', amount: 99999 }],
          },
        ],
      },
    });

    const { page } = await getCampingPage();

    expect(page?.slug).toBe('camping');
    expect((campingParts(page?.sections).prices?.rows ?? []).map(({ amount }) => amount)).toEqual(
      SEED_ROWS.map(({ amount }) => amount),
    );

    await removePage('directions');
  });

  it('страницы кемпинга нет — page равен null, site — глобал', async () => {
    await removePage('camping');

    const data = await getCampingPage();

    expect(data.page).toBeNull();
    expect(data.site).toMatchObject(SITE);
  });

  it('сумма, поправленная в CMS, видна со следующего чтения — кеша между ними нет', async () => {
    const created = await createCamping();

    expect(await firstAmount()).toBe(SEED_ROWS[0].amount);

    const { sections } = await payload.findByID({ collection: 'pages', id: created.id, depth: 0 });

    await payload.update({
      collection: 'pages',
      id: created.id,
      data: {
        sections: (sections ?? []).map((section) =>
          section.blockType === 'prices' && section.anchor === 'camping-prices'
            ? { ...section, rows: (section.rows ?? []).map((row, index) => (index ? row : { ...row, amount: 2500 })) }
            : section,
        ),
      },
    });

    expect(await firstAmount()).toBe(2500);
  });

  it('номер «позвоните Анастасии» в разделе «Телефон» не сохраняется ни созданием, ни правкой', async () => {
    const wrong = { ...CAMPING_BOOKING, phone: NOT_A_PHONE } as unknown as Section;

    await removePage('camping');
    await expect(
      payload.create({ collection: 'pages', data: { ...CAMPING, sections: sectionsWith(wrong) } }),
    ).rejects.toMatchObject(PHONE_REJECTION);

    const created = await createCamping();

    await expect(
      payload.update({ collection: 'pages', id: created.id, data: { sections: sectionsWith(wrong) } }),
    ).rejects.toMatchObject(PHONE_REJECTION);
    expect(bookingOf(await payload.findByID({ collection: 'pages', id: created.id }))?.phone).toBe(
      CAMPING_BOOKING.phone,
    );
  });
});
