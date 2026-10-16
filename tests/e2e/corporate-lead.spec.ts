import { expect, test, type APIRequestContext } from '@playwright/test';
import { CORPORATE_PATH, SINK_BASE_URL } from './consts';
import { SITE } from './seed/data';
import type { SinkCall } from './types';

/**
 * Смоук нового потока: заявка со страницы корпоративов доходит до заглушки бота и почты. Отказы (нет согласия,
 * ловушка, повтор) смоук не проверяет — их закрывают интеграционные тесты обработчика.
 *
 * Лимит заявок живет в памяти сервера, а `reuseExistingServer` оставляет его между прогонами: свой адрес на каждый
 * прогон не дает повторному запуску упереться в лимит.
 */
const CLIENT_ADDRESS = `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.9`;

test.use({ extraHTTPHeaders: { 'x-forwarded-for': CLIENT_ADDRESS } });

const DEMO_MARK = 'демо Кауп';

const callsOf = async (request: APIRequestContext, marker: string) => {
  const response = await request.get(`${SINK_BASE_URL}/calls`);
  const calls = (await response.json()) as SinkCall[];

  return calls.filter((call) => call.body.includes(marker));
};

test('заявка со страницы корпоративов уходит в бот и на почту с пометкой «демо Кауп»', async ({ page, request }) => {
  const marker = `Проба корпоратива ${Date.now()}`;

  await page.goto(CORPORATE_PATH);

  const main = page.locator('main');
  const form = main.locator('form');

  await expect(form).toBeVisible();
  await expect(main).toContainText(/демо-версия/i);
  await expect(main).toContainText(/не\sпоселению/);

  await form.getByRole('textbox', { name: /^Имя/ }).fill(marker);
  await form.getByRole('textbox', { name: /^Телефон/ }).fill('+7 900 123-45-67');
  await form.getByRole('checkbox', { name: /согласие/i }).check();
  await form.getByRole('button', { name: 'Отправить заявку' }).click();

  await expect(main).toContainText(/поселению заявка не\sпередается/);
  await expect(main).toContainText(/демо-версия/i);
  await expect(main).toContainText(SITE.phone);

  await expect
    .poll(async () => (await callsOf(request, marker)).map(({ channel }) => channel).sort())
    .toEqual(['mail', 'telegram']);

  for (const call of await callsOf(request, marker)) {
    expect(call.body, call.channel).toContain(DEMO_MARK);
  }
});
