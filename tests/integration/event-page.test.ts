import config from '@payload-config';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_MEDIA_DIR, MEDIA_DIR } from '@/cms/consts';
import { getEventPage } from '@/cms/event';

/** Проверочные данные теста — не контент владельцев. */
const RADARIO = 'https://radario.ru/customer/afisha/proverka-sobytie-1';
const RADARIO_NEW = 'https://radario.ru/customer/afisha/proverka-sobytie-1-novaya?openAsLinkKey=proverka';

const OWN = 'proverka-sobytie-svoe';
const OTHER = 'proverka-sobytie-chuzhoe';

const PHOTOS = ['event-page-1.jpg', 'event-page-2.jpg'];
const PHOTOS_DIR = path.join(tmpdir(), 'kaup39-event-page-test');

const SITE = {
  name: 'Проверочное поселение страницы события',
  address: 'Проверочная область, 4 км от проверочного поселка',
  phone: '8 (000) 11-22-33',
  email: 'event-page@example.com',
};

/** Так дату без времени хранит Payload: полдень UTC, чтобы день не съехал ни в одном часовом поясе. */
const dayOnly = (date: string) => `${date}T12:00:00.000Z`;

let payload: Payload;
let ownId: number;
const mediaIds: number[] = [];

beforeAll(async () => {
  // тест пишет файлы в медиатеку: у тестов она своя, каталог владельцев трогать нельзя
  expect(path.resolve(MEDIA_DIR)).not.toBe(path.resolve(DEFAULT_MEDIA_DIR));
  mkdirSync(PHOTOS_DIR, { recursive: true });

  for (const [index, file] of PHOTOS.entries()) {
    await sharp({ create: { width: 320, height: 200, channels: 3, background: { r: 90 * index, g: 60, b: 30 } } })
      .jpeg()
      .toFile(path.join(PHOTOS_DIR, file));
  }

  payload = await getPayload({ config });

  for (const [index, file] of PHOTOS.entries()) {
    const media = await payload.create({
      collection: 'media',
      data: { alt: `Проверочный кадр события ${index + 1}` },
      filePath: path.join(PHOTOS_DIR, file),
    });

    mediaIds.push(media.id);
  }

  await payload.updateGlobal({ slug: 'site', data: SITE });

  const own = await payload.create({
    collection: 'events',
    data: {
      title: 'Проверочное событие страницы',
      slug: OWN,
      ticketUrl: RADARIO,
      tariffs: [{ kind: 'entry', amount: 700 }],
      gallery: mediaIds,
    },
  });
  const other = await payload.create({
    collection: 'events',
    data: {
      title: 'Чужое проверочное событие',
      slug: OTHER,
      ticketUrl: 'https://radario.ru/customer/afisha/proverka-sobytie-2',
      tariffs: [{ kind: 'adult', amount: 1000 }],
    },
  });

  ownId = own.id;

  // даты двух событий вперемешку: ни порядок записи, ни обратный ему не совпадают с порядком дат
  const dates = [
    { event: own.id, date: '2026-10-24', start: '12:00', end: '15:00' },
    { event: other.id, date: '2026-10-11', start: '16:00', end: '19:00' },
    { event: own.id, date: '2026-10-10', start: '15:00', end: '18:00' },
    { event: other.id, date: '2026-10-17', start: '16:00', end: '19:00' },
    { event: own.id, date: '2026-10-17', start: '12:00', end: '15:00' },
    { event: own.id, date: '2026-10-10', start: '12:00', end: '14:00' },
    { event: other.id, date: '2026-10-10', start: '13:00', end: '19:00' },
  ];

  for (const { date, ...rest } of dates) {
    await payload.create({ collection: 'schedule', data: { ...rest, date: dayOnly(date) } });
  }
});

afterAll(async () => {
  for (const id of mediaIds) {
    await payload.delete({ collection: 'media', id });
  }

  await payload.destroy();
  rmSync(PHOTOS_DIR, { recursive: true, force: true });
});

describe('данные страницы события', () => {
  it('только свое событие и его даты по порядку дня и начала, галерея раскрыта, site — глобал', async () => {
    const data = await getEventPage(OWN);

    expect(data?.event.slug).toBe(OWN);
    expect(data?.event.id).toBe(ownId);
    expect(data?.dates.map((item) => item.event.slug)).toEqual([OWN, OWN, OWN, OWN]);
    expect(data?.dates.map(({ date, start, end }) => [date, start, end])).toEqual([
      ['2026-10-10', '12:00', '14:00'],
      ['2026-10-10', '15:00', '18:00'],
      ['2026-10-17', '12:00', '15:00'],
      ['2026-10-24', '12:00', '15:00'],
    ]);

    const gallery = data?.event.gallery ?? [];

    expect(gallery).toHaveLength(PHOTOS.length);

    for (const photo of gallery) {
      expect(typeof photo).toBe('object');
      expect(typeof photo === 'object' ? photo.url : null).toEqual(expect.stringMatching(/^\/api\/media\/file\//));
    }

    expect(data?.site).toMatchObject(SITE);
  });

  it('события с таким slug нет — null', async () => {
    expect(await getEventPage('proverka-net-takogo-sobytiya')).toBeNull();
  });

  it('ссылка на кассу, поправленная в CMS, видна со следующего чтения — кеша между ними нет', async () => {
    expect((await getEventPage(OWN))?.event.ticketUrl).toBe(RADARIO);

    await payload.update({ collection: 'events', id: ownId, data: { ticketUrl: RADARIO_NEW } });

    expect((await getEventPage(OWN))?.event.ticketUrl).toBe(RADARIO_NEW);
  });
});
