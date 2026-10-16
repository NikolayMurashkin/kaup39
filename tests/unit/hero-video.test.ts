import { describe, expect, it } from 'vitest';
import { toHeroVideo } from '@/cms/video';
import { HERO_NARROW_MEDIA } from '@/components/FirstScreen/consts';
import { canPlayHeroVideo } from '@/components/FirstScreen/video';
import type { Media, Page } from '@/payload-types';

/** Группа `hero` с полями видео: так ее отдает Payload с `depth: 1`. */
type HeroWithVideo = NonNullable<Page['hero']> & {
  videoMp4?: number | Media | null;
  videoWebm?: number | Media | null;
};

/** Медиазапрос «меньше движения» — без него видео не включается. */
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const MP4_URL = '/api/media/file/loop.mp4';
const WEBM_URL = '/api/media/file/loop.webm';

/** Документ медиатеки с файлом нужного типа. Проверочные данные теста. */
const mediaOf = (id: number, mimeType: string, url: string | null): Media => ({
  id,
  alt: `Проверочный файл ${id}`,
  updatedAt: '2026-10-16T00:00:00.000Z',
  createdAt: '2026-10-16T00:00:00.000Z',
  url,
  filename: url?.split('/').at(-1) ?? null,
  mimeType,
});

const MP4 = mediaOf(1, 'video/mp4', MP4_URL);
const WEBM = mediaOf(2, 'video/webm', WEBM_URL);
const PICTURE = mediaOf(3, 'image/jpeg', '/api/media/file/night.jpg');

const heroOf = (fields: HeroWithVideo): HeroWithVideo => fields;

describe('видео первого экрана из CMS: без годного файла первый экран остается кадром', () => {
  it('оба поля — файлы своего типа: адреса обоих', () => {
    expect(toHeroVideo(heroOf({ videoMp4: MP4, videoWebm: WEBM }))).toEqual({ mp4: MP4_URL, webm: WEBM_URL });
  });

  it('только один файл: второй адрес пустой', () => {
    expect(toHeroVideo(heroOf({ videoMp4: MP4 }))).toEqual({ mp4: MP4_URL, webm: null });
    expect(toHeroVideo(heroOf({ videoWebm: WEBM }))).toEqual({ mp4: null, webm: WEBM_URL });
  });

  it.each<[string, Page['hero'] | null | undefined]>([
    ['поля пустые', heroOf({})],
    ['поля null', heroOf({ videoMp4: null, videoWebm: null })],
    ['поля undefined', heroOf({ videoMp4: undefined, videoWebm: undefined })],
    ['hero нет', undefined],
    ['hero null', null],
  ])('%s: видео нет', (_, hero) => {
    expect(toHeroVideo(hero)).toBeNull();
  });

  it('несвязанный id или документ без адреса — как пустое поле; оба такие — видео нет', () => {
    const noUrl = mediaOf(4, 'video/mp4', null);

    expect(toHeroVideo(heroOf({ videoMp4: 1, videoWebm: WEBM }))).toEqual({ mp4: null, webm: WEBM_URL });
    expect(toHeroVideo(heroOf({ videoMp4: noUrl, videoWebm: WEBM }))).toEqual({ mp4: null, webm: WEBM_URL });
    expect(toHeroVideo(heroOf({ videoMp4: MP4, videoWebm: 2 }))).toEqual({ mp4: MP4_URL, webm: null });
    expect(toHeroVideo(heroOf({ videoMp4: 1, videoWebm: 2 }))).toBeNull();
    expect(toHeroVideo(heroOf({ videoMp4: noUrl, videoWebm: mediaOf(5, 'video/webm', null) }))).toBeNull();
  });

  it('файл не того типа в поле — это поле пустое', () => {
    expect(toHeroVideo(heroOf({ videoMp4: PICTURE, videoWebm: WEBM }))).toEqual({ mp4: null, webm: WEBM_URL });
    expect(toHeroVideo(heroOf({ videoMp4: WEBM, videoWebm: MP4 }))).toBeNull();
  });
});

type EnvOptions = {
  width: number;
  reduced?: boolean;
  connection?: { saveData?: boolean };
};

/** Окно браузера: медиазапросы отвечают по точной строке, остальные не совпадают. */
const envOf = ({ width, reduced = false, connection }: EnvOptions) => ({
  matchMedia: (query: string) => ({
    matches: query === HERO_NARROW_MEDIA ? width <= 640 : query === REDUCED_MOTION ? reduced : false,
  }),
  navigator: connection ? { connection } : {},
});

describe('видео включается только шире 640 px, без Save-Data и без «меньше движения»', () => {
  it.each<[number, boolean]>([
    [1440, true],
    [1280, true],
    [641, true],
    [640, false],
    [390, false],
    [320, false],
  ])('ширина %i px: видео — %s', (width, expected) => {
    expect(canPlayHeroVideo(envOf({ width }))).toBe(expected);
  });

  it('Save-Data включен — видео нет', () => {
    expect(canPlayHeroVideo(envOf({ width: 1440, connection: { saveData: true } }))).toBe(false);
  });

  it('prefers-reduced-motion: reduce — видео нет', () => {
    expect(canPlayHeroVideo(envOf({ width: 1440, reduced: true }))).toBe(false);
  });

  it('браузер без navigator.connection (Safari, Firefox) или без Save-Data — видео есть', () => {
    expect(canPlayHeroVideo(envOf({ width: 1440 }))).toBe(true);
    expect(canPlayHeroVideo(envOf({ width: 1440, connection: {} }))).toBe(true);
    expect(canPlayHeroVideo(envOf({ width: 1440, connection: { saveData: false } }))).toBe(true);
  });
});
