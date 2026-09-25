import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { BASE_URL, SCHEDULE_PATH, VIEWPORTS } from './consts';
import { E2E_ADMIN, HOME, SITE, TYPICAL_FIRST_SCREEN } from './seed/data';
import type { DocsResponse } from './types';

let api: APIRequestContext;
let headers: Record<string, string>;
let homeId: number;

/** Видимая ссылка на расписание внутри `scope`, целиком в первом экране: без прокрутки страницы. */
const expectScheduleLinkInView = async (page: Page, scope: string, height: number) => {
  const link = page.locator(`${scope} a[href="${SCHEDULE_PATH}"]`).filter({ visible: true }).first();

  await expect(link).toBeVisible();

  const box = await link.boundingBox();

  expect(box && box.y >= 0 && box.y + box.height <= height, `${scope}: ссылка ниже первого экрана`).toBe(true);
};

/**
 * Тексты первого экрана подменяются через REST на тексты обычной длины и возвращаются после теста — в хуках,
 * по той же причине, что в `empty-schedule.state.spec.ts`. Возвращаются значения засева, а не прочитанные
 * из базы: засев один и известен целиком.
 */
test.beforeAll(async ({ playwright }) => {
  api = await playwright.request.newContext({ baseURL: BASE_URL });

  const login = await api.post('/api/users/login', { data: E2E_ADMIN });

  expect(login.ok()).toBe(true);
  headers = { Authorization: `JWT ${(await login.json()).token}` };

  const pages = (await (
    await api.get(`/api/pages?where[slug][equals]=${HOME.slug}&depth=0`, { headers })
  ).json()) as DocsResponse<{ id: number }>;

  expect(pages.docs).toHaveLength(1);
  homeId = pages.docs[0].id;

  expect((await api.post('/api/globals/site', { headers, data: TYPICAL_FIRST_SCREEN.site })).ok()).toBe(true);
  expect((await api.patch(`/api/pages/${homeId}`, { headers, data: TYPICAL_FIRST_SCREEN.home })).ok()).toBe(true);
});

test.afterAll(async () => {
  const site = await api.post('/api/globals/site', { headers, data: { name: SITE.name, address: SITE.address } });
  const home = await api.patch(`/api/pages/${homeId}`, { headers, data: { title: HOME.title, lead: HOME.lead } });

  await api.dispose();
  expect(site.ok()).toBe(true);
  expect(home.ok()).toBe(true);
});

for (const viewport of VIEWPORTS) {
  test(`${viewport.name}: ссылка на расписание видна в шапке и в первом экране`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.locator('[data-first-screen] h1')).toContainText(TYPICAL_FIRST_SCREEN.home.title);
    await expectScheduleLinkInView(page, 'header', viewport.height);
    await expectScheduleLinkInView(page, '[data-first-screen]', viewport.height);
  });
}
