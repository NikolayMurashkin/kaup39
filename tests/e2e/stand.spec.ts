import { expect, test } from '@playwright/test';
import { BASE_URL, DEMO_PATHS, SHOWCASE_PATH, STAND_BASE_URL } from './consts';

/** Строка подвала из критерия (D15, D27). Пробел после «от» неразрывный, `\s` его покрывает. */
const DEMO_NOTE = /Демо-версия сайта от\sстудии MRSHKN/;

const DISALLOW_ALL = /^Disallow: \/$/m;

test.describe('окружение стенда закрывает демо от индексации', () => {
  for (const path of DEMO_PATHS) {
    test(`${path} отдает X-Robots-Tag: noindex, nofollow`, async ({ request }) => {
      const response = await request.get(`${STAND_BASE_URL}${path}`);

      expect(response.status()).toBe(200);
      expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
    });
  }

  test('robots.txt запрещает весь сайт', async ({ request }) => {
    const response = await request.get(`${STAND_BASE_URL}/robots.txt`);

    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(DISALLOW_ALL);
  });

  test('витрина компонентов отвечает 404', async ({ request }) => {
    const response = await request.get(`${STAND_BASE_URL}${SHOWCASE_PATH}`);

    expect(response.status()).toBe(404);
  });
});

test.describe('та же сборка без окружения стенда индексацию не закрывает', () => {
  for (const path of DEMO_PATHS) {
    test(`${path} без X-Robots-Tag`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${path}`);

      expect(response.status()).toBe(200);
      expect(response.headers()['x-robots-tag']).toBeUndefined();
    });
  }

  test('robots.txt не запрещает сайт', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);

    expect(response.status()).toBe(200);
    expect(await response.text()).not.toMatch(DISALLOW_ALL);
  });
});

test.describe('подпись демо в подвале', () => {
  for (const path of DEMO_PATHS) {
    test(`на ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator('footer')).toContainText(DEMO_NOTE);
    });
  }
});
