import config from '@payload-config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_MEDIA_DIR, MEDIA_DIR } from '@/cms/consts';
import { getHome } from '@/cms/home';
import type { Media, Page } from '@/payload-types';

/**
 * Фикстуры — 1 с, 64×36, без звука, по несколько КБ: крупных видео в git нет. Собраны так:
 *   ffmpeg -f lavfi -i testsrc=size=64x36:rate=10:duration=1 -an -c:v libx264 -pix_fmt yuv420p \
 *     -movflags +faststart tests/fixtures/hero.mp4
 *   ffmpeg -f lavfi -i testsrc=size=64x36:rate=10:duration=1 -an -c:v libvpx-vp9 -b:v 50k tests/fixtures/hero.webm
 */
const FIXTURES = path.resolve('tests/fixtures');

/** Группа `hero` с полями видео так, как ее отдает Payload с `depth: 1`. */
type HeroWithVideo = NonNullable<Page['hero']> & {
  videoMp4?: number | Media | null;
  videoWebm?: number | Media | null;
};

/** Проверочные данные теста — не контент владельцев. */
const HOME = { title: 'Проверочная главная с видео', slug: 'home' as const };

/** Файл для Local API: как его отдает загрузка из админки. */
const fileOf = (name: string, mimetype: string, data: Buffer = readFileSync(path.join(FIXTURES, name))) => ({
  data,
  mimetype,
  name,
  size: data.length,
});

/** Отказ Payload по полю видео первого экрана, а не по другой причине. */
const rejectionAt = (fieldPath: string) => ({
  data: { errors: [expect.objectContaining({ path: fieldPath })] },
});

let payload: Payload;
/** Документы, загруженные через Local API: удаляются вместе с файлом. */
const uploadedIds: number[] = [];
/** Документы видео без файла, записанные прямо в базу для проверки поля: от загрузки файла поле не зависит. */
const recordIds: number[] = [];

const upload = async (alt: string, file: ReturnType<typeof fileOf>) => {
  const media = await payload.create({ collection: 'media', data: { alt }, file });

  uploadedIds.push(media.id);

  return media;
};

const recordOf = async (filename: string, mimeType: string) => {
  const now = new Date().toISOString();
  const record = (await payload.db.create({
    collection: 'media',
    data: { alt: `Проверочный файл ${filename}`, filename, mimeType, filesize: 1, createdAt: now, updatedAt: now },
  })) as Media;

  recordIds.push(record.id);

  return record;
};

const removeHome = () => payload.delete({ collection: 'pages', where: { slug: { equals: 'home' } } });

/** Главная с нуля с полями видео первого экрана: прежнюю, оставленную другими файлами тестов, сначала снимаем. */
const createHome = async (video: { videoMp4?: number; videoWebm?: number }) => {
  await removeHome();

  const hero: HeroWithVideo = { ...video };

  return payload.create({ collection: 'pages', data: { ...HOME, hero } });
};

let mp4: Media;
let webm: Media;
let picture: Media;

beforeAll(async () => {
  // тест пишет файлы в медиатеку: у тестов она своя, каталог владельцев трогать нельзя
  expect(path.resolve(MEDIA_DIR)).not.toBe(path.resolve(DEFAULT_MEDIA_DIR));

  payload = await getPayload({ config });

  const jpeg = await sharp({ create: { width: 64, height: 36, channels: 3, background: { r: 40, g: 80, b: 60 } } })
    .jpeg()
    .toBuffer();

  picture = await upload('Проверочный кадр первого экрана', fileOf('hero-video-picture.jpg', 'image/jpeg', jpeg));
  mp4 = await recordOf('hero-video-record.mp4', 'video/mp4');
  webm = await recordOf('hero-video-record.webm', 'video/webm');
});

afterAll(async () => {
  await removeHome();

  for (const id of uploadedIds) {
    await payload.delete({ collection: 'media', id });
  }

  for (const id of recordIds) {
    await payload.db.deleteOne({ collection: 'media', where: { id: { equals: id } } });
  }

  await payload.destroy();
});

describe('медиатека принимает видео первого экрана: H.264 и WebM', () => {
  it.each([
    ['hero.mp4', 'video/mp4', /^\/api\/media\/file\/hero[^/]*\.mp4$/],
    ['hero.webm', 'video/webm', /^\/api\/media\/file\/hero[^/]*\.webm$/],
  ])('файл %s сохраняется как %s с адресом', async (name, mimeType, url) => {
    const created = payload.create({
      collection: 'media',
      data: { alt: `Проверочная петля ${name}` },
      file: fileOf(name, mimeType),
    });

    const remembered = created.then((media) => {
      uploadedIds.push(media.id);

      return media;
    });

    await expect(remembered).resolves.toMatchObject({
      mimeType,
      url: expect.stringMatching(url),
    });
  });

  it('другой видеотип не принимается: медиатека открыта двум форматам, а не любому видео', async () => {
    // тот же ролик с брендом QuickTime в `ftyp`: Payload по содержимому узнает video/quicktime, а не текст
    const quicktime = Buffer.from(readFileSync(path.join(FIXTURES, 'hero.mp4')));

    quicktime.write('qt  ', 8, 'latin1');

    const mov = fileOf('hero-video.mov', 'video/quicktime', quicktime);

    await expect(
      payload.create({ collection: 'media', data: { alt: 'Проверочный MOV' }, file: mov }),
    ).rejects.toMatchObject({
      data: {
        errors: [expect.objectContaining({ path: 'file', message: expect.stringContaining('video/quicktime') })],
      },
    });
  });
});

describe('поле видео у первого экрана страницы', () => {
  it('главная с MP4 и WebM сохраняется, данные главной отдают оба файла с адресом и типом', async () => {
    await createHome({ videoMp4: mp4.id, videoWebm: webm.id });

    const hero = (await getHome()).page?.hero as HeroWithVideo | undefined;

    expect(hero?.videoMp4).toMatchObject({
      id: mp4.id,
      url: '/api/media/file/hero-video-record.mp4',
      mimeType: 'video/mp4',
    });
    expect(hero?.videoWebm).toMatchObject({
      id: webm.id,
      url: '/api/media/file/hero-video-record.webm',
      mimeType: 'video/webm',
    });
  });

  it('в поле MP4 не встает картинка или WebM, в поле WebM — MP4', async () => {
    await expect(createHome({ videoMp4: picture.id })).rejects.toMatchObject(rejectionAt('hero.videoMp4'));
    await expect(createHome({ videoMp4: webm.id })).rejects.toMatchObject(rejectionAt('hero.videoMp4'));
    await expect(createHome({ videoWebm: mp4.id })).rejects.toMatchObject(rejectionAt('hero.videoWebm'));
  });
});
