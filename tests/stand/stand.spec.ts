import { expect, test } from '@playwright/test';
import { lookup } from 'node:dns/promises';
import { DEMO_PATHS, FOREIGN_HOSTS, SCHEMES, SHOWCASE_PATH, STAND_HOST, TRAEFIK_PATHS, WILDCARD_SAN } from './consts';
import { certificateNames, probe } from './probe';

/** Строка подвала из критерия (D15, D27). Пробел после «от» неразрывный, `\s` его покрывает. */
const DEMO_NOTE = /Демо-версия сайта от\sстудии MRSHKN/;

/** Системный резолвер: `resolve4` идет мимо него через c-ares и на параллельных тестах ловит ENOTFOUND. */
const serverIp = async () => (await lookup(STAND_HOST, { family: 4 })).address;

test.describe('стенд открыт по ссылке и закрыт от индексации', () => {
  test('главная открывается без пароля и отдает X-Robots-Tag: noindex', async ({ request }) => {
    const response = await request.get('/');

    expect(response.status()).toBe(200);
    expect(response.headers()['www-authenticate']).toBeUndefined();
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  });

  test('robots.txt запрещает весь сайт', async ({ request }) => {
    const response = await request.get('/robots.txt');

    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(/^Disallow: \/$/m);
  });

  test('витрина компонентов отвечает 404', async ({ request }) => {
    const response = await request.get(SHOWCASE_PATH);

    expect(response.status()).toBe(404);
  });

  // по имени стенда отвечает приложение: `/dashboard/` Next сначала переводит на адрес без слеша, поэтому
  // смотрится итоговый ответ, а не первый
  test('пути API и дашборда Traefik по имени стенда отвечают 404 приложения', async ({ request }) => {
    const answers: string[] = [];

    for (const path of TRAEFIK_PATHS) {
      answers.push(`${path} → ${(await request.get(path)).status()}`);
    }

    expect(answers.filter((answer) => !answer.endsWith('→ 404'))).toEqual([]);
  });

  for (const path of DEMO_PATHS) {
    test(`в подвале ${path} — подпись демо`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator('footer')).toContainText(DEMO_NOTE);
    });
  }
});

test.describe('сертификат и имена на сервере', () => {
  test('сертификат стенда — wildcard без имени стенда отдельной строкой (D24)', async () => {
    const names = await certificateNames(await serverIp(), STAND_HOST);

    expect(names).toContain(WILDCARD_SAN);
    expect(names).not.toContain(`DNS:${STAND_HOST}`);
  });

  for (const scheme of SCHEMES) {
    test(`${scheme}: по IP и по чужим именам сервер отдает только 404`, async () => {
      const ip = await serverIp();
      const hosts = [undefined, ...FOREIGN_HOSTS];
      const answers: string[] = [];

      for (const host of hosts) {
        for (const path of ['/', ...TRAEFIK_PATHS]) {
          const { status } = await probe({ scheme, ip, host, path });

          answers.push(`${host ?? ip}${path} → ${status}`);
        }
      }

      expect(answers.filter((answer) => !answer.endsWith('→ 404'))).toEqual([]);
    });
  }
});
