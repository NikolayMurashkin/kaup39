import { expect, test, type APIRequestContext } from '@playwright/test';
import { BASE_URL, SCHEDULE_PATH, VIEWPORTS } from './consts';
import { E2E_ADMIN } from './seed/data';
import type { DocsResponse, ScheduleDoc } from './types';

let api: APIRequestContext;
let headers: Record<string, string>;
let saved: ScheduleDoc[] = [];

/**
 * Даты расписания снимаются через REST до теста и возвращаются после него — в хуках, а не в `finally`:
 * хук отрабатывает и тогда, когда тест упал по таймауту и его собственный контекст запросов уже закрыт.
 * Файл идет отдельным проектом после остальных: пока расписание пустое, другие тесты главной видели бы
 * не ту страницу.
 */
test.beforeAll(async ({ playwright }) => {
  api = await playwright.request.newContext({ baseURL: BASE_URL });

  const login = await api.post('/api/users/login', { data: E2E_ADMIN });

  expect(login.ok()).toBe(true);
  headers = { Authorization: `JWT ${(await login.json()).token}` };
  saved = (
    (await (await api.get('/api/schedule?pagination=false&depth=0', { headers })).json()) as DocsResponse<ScheduleDoc>
  ).docs;

  expect(saved.length).toBeGreaterThan(0);
  expect((await api.delete('/api/schedule?where[id][exists]=true', { headers })).ok()).toBe(true);
});

test.afterAll(async () => {
  const failed: string[] = [];

  // возвращаются все даты, даже если какая-то не записалась: отказ проверяется после цикла
  for (const { event, date, start, end, show } of saved) {
    const response = await api.post('/api/schedule', { headers, data: { event, date, start, end, show } });

    if (!response.ok()) failed.push(date);
  }

  await api.dispose();
  expect(failed).toEqual([]);
});

test('при пустом расписании блок ближайших событий не рендерится, а ссылка на расписание остается в первом экране', async ({
  page,
}) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.locator('[data-upcoming]')).toHaveCount(0);
    await expect(page.getByText('ближайшее событие', { exact: true })).toHaveCount(0);

    const link = page.locator(`[data-first-screen] a[href="${SCHEDULE_PATH}"]`).filter({ visible: true }).first();

    await expect(link, `${viewport.name}: ссылки на расписание в первом экране нет`).toBeVisible({ timeout: 5_000 });

    const box = await link.boundingBox();

    expect(box && box.y + box.height <= viewport.height, `${viewport.name}: ссылка ниже первого экрана`).toBe(true);
  }
});
