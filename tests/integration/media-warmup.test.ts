import config from '@payload-config';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getPayload, type Payload } from 'payload';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { DEFAULT_MEDIA_DIR, MEDIA_DIR } from '@/cms/consts';
import { warmupPaths } from '@/cms/warmup';
import type { Media } from '@/payload-types';

/**
 * После сохранения кадра медиатека прогревает оптимизатор: первая кодировка AVIF занимает секунды, и ждать ее
 * должен не первый посетитель. Оптимизатор здесь — подмененный `fetch`: в счет идут только запросы к `/_next/image`.
 */

const PHOTOS_DIR = path.join(tmpdir(), 'kaup39-media-warmup-test');
const FIXTURES = path.resolve('tests/fixtures');

const WAIT = { timeout: 10_000, interval: 50 };

/** Сохранение кадра не ждет кодировок: дольше этого — значит ждет. */
const SAVE_LIMIT_MS = 5_000;

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

const originalFetch = globalThis.fetch;

const urlOf = (input: FetchInput) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;

  return input.url;
};

const isOptimizer = (input: FetchInput) => urlOf(input).includes('/_next/image');

/** Как отвечает оптимизатор в текущем тесте. */
let optimizer: () => Promise<Response> = () => Promise.resolve(new Response(null, { status: 200 }));

let payload: Payload;
let fetchSpy: MockInstance<typeof fetch>;
let warnSpy: MockInstance;
const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => {
  unhandled.push(reason);
};
const mediaIds: number[] = [];

type OptimizerCall = { url: URL | null; raw: string; accept: string };

const optimizerCalls = (): OptimizerCall[] =>
  fetchSpy.mock.calls
    .filter(([input]) => isOptimizer(input))
    .map(([input, init]: [FetchInput, FetchInit?]) => {
      const raw = urlOf(input);
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));

      return { url: URL.canParse(raw) ? new URL(raw) : null, raw, accept: headers.get('accept') ?? '' };
    });

/** Путь и строка запроса: так их сравнивают с `warmupPaths`. */
const calledPaths = () => optimizerCalls().map(({ url, raw }) => (url ? `${url.pathname}${url.search}` : raw));

const sorted = (items: string[]) => [...items].sort();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const jpeg = async (name: string, width: number, height: number) => {
  const file = path.join(PHOTOS_DIR, name);

  await sharp({ create: { width, height, channels: 3, background: { r: 120, g: 70, b: 40 } } })
    .jpeg()
    .toFile(file);

  return file;
};

const create = async (alt: string, filePath: string) => {
  const media = await payload.create({ collection: 'media', data: { alt }, filePath });

  mediaIds.push(media.id);

  return media;
};

/** Запросы прогрева этого кадра дошли до оптимизатора — ровно те, что дает `warmupPaths`. */
const expectWarmed = async (media: Media, width: number) => {
  const expected = warmupPaths({ url: media.url ?? '', width });

  await vi.waitFor(() => {
    expect(optimizerCalls().length).toBeGreaterThan(0);
    expect(sorted(calledPaths())).toEqual(sorted(expected));
  }, WAIT);
};

beforeAll(async () => {
  // тест пишет файлы в медиатеку: у тестов она своя, каталог владельцев трогать нельзя
  expect(path.resolve(MEDIA_DIR)).not.toBe(path.resolve(DEFAULT_MEDIA_DIR));
  mkdirSync(PHOTOS_DIR, { recursive: true });

  payload = await getPayload({ config });

  fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation((input: FetchInput, init?: FetchInit) =>
      isOptimizer(input) ? optimizer() : originalFetch(input, init),
    );
  warnSpy = vi.spyOn(payload.logger, 'warn');
  process.on('unhandledRejection', onUnhandled);
});

beforeEach(() => {
  optimizer = () => Promise.resolve(new Response(null, { status: 200 }));
  fetchSpy.mockClear();
  warnSpy.mockClear();
});

afterAll(async () => {
  process.off('unhandledRejection', onUnhandled);
  fetchSpy.mockRestore();
  warnSpy.mockRestore();

  for (const id of mediaIds) {
    await payload.delete({ collection: 'media', id });
  }

  rmSync(PHOTOS_DIR, { recursive: true, force: true });
  await payload.destroy();
});

describe('прогрев кадров медиатеки', () => {
  it('после сохранения кадра оптимизатор получает варианты для ширин sizes с AVIF в Accept', async () => {
    const media = await create('Проверочный кадр прогрева', await jpeg('media-warmup-create.jpg', 1000, 600));

    await expectWarmed(media, 1000);

    for (const { url, raw, accept } of optimizerCalls()) {
      expect(['127.0.0.1', 'localhost'], `хост запроса ${raw}`).toContain(url?.hostname);
      expect(accept, `Accept запроса ${raw}`).toContain('image/avif');
    }
  });

  it('оптимизатор недоступен — кадр сохранен, ошибка записана в журнал', async () => {
    optimizer = () => Promise.reject(new TypeError('fetch failed'));

    const media = await create('Проверочный кадр без оптимизатора', await jpeg('media-warmup-refused.jpg', 1000, 600));

    expect(media.id).toBeTypeOf('number');
    expect((await payload.findByID({ collection: 'media', id: media.id })).id).toBe(media.id);

    await vi.waitFor(() => expect(warnSpy).toHaveBeenCalled(), WAIT);
    // остальные запросы прогрева успевают упасть до следующего теста
    await sleep(500);

    expect(unhandled).toEqual([]);
  });

  it('оптимизатор ответил 500 — кадр сохранен, ошибка записана в журнал', async () => {
    optimizer = () => Promise.resolve(new Response('ошибка', { status: 500 }));

    const media = await create(
      'Проверочный кадр с ошибкой оптимизатора',
      await jpeg('media-warmup-500.jpg', 1000, 600),
    );

    expect((await payload.findByID({ collection: 'media', id: media.id })).id).toBe(media.id);

    await vi.waitFor(() => expect(warnSpy).toHaveBeenCalled(), WAIT);
    await sleep(500);
  });

  it('оптимизатор не отвечает — сохранение не ждет кодировок', async () => {
    optimizer = () => new Promise<Response>(() => {});

    const file = await jpeg('media-warmup-hang.jpg', 1000, 600);
    const started = performance.now();
    const saved = await Promise.race([
      create('Проверочный кадр с зависшим оптимизатором', file),
      sleep(SAVE_LIMIT_MS).then(() => null),
    ]);
    const elapsed = performance.now() - started;

    expect(saved, `сохранение не закончилось за ${SAVE_LIMIT_MS} мс`).not.toBeNull();
    expect(elapsed).toBeLessThan(SAVE_LIMIT_MS);
    // оптимизатор действительно спрашивали: иначе быстрое сохранение ничего не доказывает
    await vi.waitFor(() => expect(optimizerCalls().length).toBeGreaterThan(0), WAIT);
    // запросы кадра идут по одному: пока первый не ответил, второго нет — параллельные кодировки AVIF заняли бы сервер
    await sleep(1_000);
    expect(optimizerCalls()).toHaveLength(1);
  });

  it('правка только подписи кадр не прогревает заново', async () => {
    const media = await create('Проверочный кадр до правки подписи', await jpeg('media-warmup-alt.jpg', 1000, 600));

    await expectWarmed(media, 1000);
    await sleep(300);
    fetchSpy.mockClear();

    await payload.update({ collection: 'media', id: media.id, data: { alt: 'Проверочный кадр после правки подписи' } });
    await sleep(1_000);

    expect(calledPaths()).toEqual([]);
  });

  it('замена файла прогревает новый файл', async () => {
    const media = await create('Проверочный кадр до замены', await jpeg('media-warmup-before.jpg', 1000, 600));

    await expectWarmed(media, 1000);
    await sleep(300);
    fetchSpy.mockClear();

    const replaced = await payload.update({
      collection: 'media',
      id: media.id,
      data: {},
      filePath: await jpeg('media-warmup-after.jpg', 1600, 900),
    });

    expect(replaced.url).not.toBe(media.url);
    await expectWarmed(replaced, 1600);
  });

  it('видео и SVG оптимизатор не кодирует — их не прогреваем', async () => {
    const svg = path.join(PHOTOS_DIR, 'media-warmup.svg');

    writeFileSync(
      svg,
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="36" viewBox="0 0 64 36"><rect width="64" height="36" fill="#286040"/></svg>',
    );

    await create('Проверочная петля без прогрева', path.join(FIXTURES, 'hero.mp4'));
    await create('Проверочный рисунок без прогрева', svg);

    // кадр-свидетель: хук жив, и в журнале оптимизатора только его запросы — у видео и SVG их нет
    const witness = await create('Проверочный кадр-свидетель', await jpeg('media-warmup-witness.jpg', 1000, 600));

    await expectWarmed(witness, 1000);
  });
});
