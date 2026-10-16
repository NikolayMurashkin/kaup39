import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

/** Боевой домен владельцев: карта сайта собрана для него, а не для стенда. */
const OWNERS_ORIGIN = 'https://kaup39.ru';

/** Главная и шесть страниц демо: у события два адреса. */
const DEMO_PATHS = [
  '/',
  '/raspisanie',
  '/sobytiya/denvikingi',
  '/sobytiya/ragnarek',
  '/kak-doehat',
  '/kemping',
  '/korporativy',
];

/** Служебные адреса: политика ПД, витрина компонентов, админка, REST, карта, ассеты сборки. */
const TECHNICAL = [/^\/politika(\/|$)/, /^\/components(\/|$)/, /^\/admin/, /^\/api/, /^\/map/, /^\/_next/];

const entries = () => sitemap().map((entry) => new URL(entry.url));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('sitemap.xml', () => {
  it('ровно семь адресов главной и шести страниц демо на домене владельцев, без повторов', () => {
    const urls = entries();

    expect(urls.map((url) => url.origin)).toEqual(DEMO_PATHS.map(() => OWNERS_ORIGIN));
    expect(urls.map((url) => url.pathname).sort()).toEqual([...DEMO_PATHS].sort());
  });

  it('ни одного технического адреса', () => {
    const urls = entries();
    const technical = urls.filter((url) => TECHNICAL.some((pattern) => pattern.test(url.pathname)));

    expect(urls.length).toBeGreaterThan(0);
    expect(
      technical.map((url) => url.pathname),
      'технические адреса в карте сайта',
    ).toEqual([]);
  });

  it('окружение стенда карту сайта не меняет', () => {
    vi.stubEnv('SITE_ENV', undefined);
    const owners = sitemap();

    vi.stubEnv('SITE_ENV', 'stand');
    const stand = sitemap();

    expect(owners.length).toBeGreaterThan(0);
    expect(stand).toEqual(owners);
  });
});

describe('robots.txt', () => {
  it('без окружения стенда — индексация открыта и ссылка на карту сайта домена владельцев', () => {
    vi.stubEnv('SITE_ENV', undefined);
    const result = robots();

    expect([result.rules].flat()).toEqual([expect.objectContaining({ userAgent: '*', allow: '/' })]);
    expect(result.sitemap).toBe(`${OWNERS_ORIGIN}/sitemap.xml`);
  });

  it('на стенде — индексация закрыта и ссылки на карту сайта нет', () => {
    vi.stubEnv('SITE_ENV', 'stand');
    const result = robots();

    expect([result.rules].flat()).toEqual([expect.objectContaining({ userAgent: '*', disallow: '/' })]);
    expect(result).not.toHaveProperty('sitemap');
  });
});
