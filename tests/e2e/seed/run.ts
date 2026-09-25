import config from '@payload-config';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getPayload } from 'payload';
import { Client } from 'pg';
import sharp from 'sharp';
import { MEDIA_DIR } from '../../../src/cms/consts';
import {
  DIRECTIONS,
  E2E_ADMIN,
  EVENTS,
  HOME,
  IMAGES,
  scheduleOf,
  settlementToday,
  SITE,
  TAVERNS,
  ZONES,
  type SeedImage,
} from './data';
import { coversOwnersMedia } from './guard';

/**
 * Засев e2e-базы: `yarn seed:e2e` с `DATABASE_URL` на базу `*_e2e` и `MEDIA_DIR` не на медиатеку владельцев.
 * База и каталог медиа пересоздаются с нуля, даты считаются от сегодняшнего дня поселения. Запускается
 * перед сервером e2e-тестов и перед Lighthouse на CI.
 */

const databaseUrl = new URL(process.env.DATABASE_URL ?? 'postgres://unset');
const databaseName = databaseUrl.pathname.slice(1);

if (!databaseName.endsWith('_e2e')) {
  throw new Error(`засев стирает базу, а «${databaseName}» не похожа на e2e-базу (имя должно кончаться на _e2e)`);
}

if (coversOwnersMedia(MEDIA_DIR)) {
  throw new Error(
    `засев стирает каталог медиа, а MEDIA_DIR «${MEDIA_DIR}» совпадает с медиатекой владельцев или содержит ее`,
  );
}

const serverUrl = new URL(databaseUrl);

serverUrl.pathname = '/postgres';

const server = new Client({ connectionString: serverUrl.toString() });

await server.connect();

if (!(await server.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName])).rowCount) {
  await server.query(`CREATE DATABASE "${databaseName}"`);
}

await server.end();

const database = new Client({ connectionString: databaseUrl.toString() });

await database.connect();
await database.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
await database.end();

rmSync(MEDIA_DIR, { recursive: true, force: true });

/** Кадр — плавный градиент с зерном вокруг заданной яркости: фотографии на CI заменяет он. */
const imageFile = async ({ file, tone }: SeedImage) => {
  const width = 1600;
  const height = 1000;
  const pixels = Buffer.alloc(width * height * 3);
  let noise = 7;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      noise = (noise * 1103515245 + 12345) % 2147483648;

      const value = tone + ((x + y) / (width + height) - 0.5) * 24 + ((noise % 17) - 8);
      const offset = (y * width + x) * 3;

      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = Math.max(0, Math.min(255, Math.round(value)));
    }
  }

  const directory = path.join(tmpdir(), 'kaup39-e2e-seed');

  mkdirSync(directory, { recursive: true });

  const target = path.join(directory, file);

  await sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 82 })
    .toFile(target);

  return target;
};

// Схема e2e-базы накатывается миграциями, как на стенде, а не push режима разработки: e2e идет на той же схеме,
// что стенд, а миграция, которой не хватает, роняет засев. PAYLOAD_MIGRATING выключает push — так же его
// выставляет `payload migrate`.
process.env.PAYLOAD_MIGRATING = 'true';

const payload = await getPayload({ config });

await payload.db.migrate();

const upload = async (image: SeedImage) =>
  (
    await payload.create({
      collection: 'media',
      data: { alt: image.alt, caption: image.caption },
      filePath: await imageFile(image),
    })
  ).id;

const night = await upload(IMAGES.night);
const day = await upload(IMAGES.day);
const gallery: number[] = [];

for (const image of IMAGES.gallery) {
  gallery.push(await upload(image));
}

const eventIds = new Map<string, number>();

for (const event of EVENTS) {
  eventIds.set(event.slug, (await payload.create({ collection: 'events', data: event })).id);
}

for (const { event, date, ...time } of scheduleOf(settlementToday())) {
  await payload.create({
    collection: 'schedule',
    data: { event: eventIds.get(event)!, date: `${date}T12:00:00.000Z`, ...time },
  });
}

for (const zone of ZONES) {
  await payload.create({ collection: 'zones', data: zone });
}

for (const tavern of TAVERNS) {
  await payload.create({ collection: 'taverns', data: tavern });
}

await payload.create({
  collection: 'pages',
  data: {
    ...HOME,
    hero: { photoNight: night, photoDay: day },
    sections: HOME.sections.map((section) =>
      section.blockType === 'photos' ? { ...section, photos: gallery } : section,
    ),
  },
});

await payload.create({ collection: 'pages', data: DIRECTIONS });
await payload.updateGlobal({ slug: 'site', data: SITE });
await payload.create({ collection: 'users', data: E2E_ADMIN });

console.log(`e2e-база ${databaseName} засеяна, медиа — в ${MEDIA_DIR}/.`);

await payload.destroy();
