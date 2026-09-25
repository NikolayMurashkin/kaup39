import { expect, test } from '@playwright/test';
import { DIRECTIONS_PATH } from './consts';
import { BUS_LINES, DEPARTURE_NOTICE, PARKING, SITE, TRANSFER_STOPS } from './seed/data';

const API_MAPS = /^https:\/\/api-maps\.yandex\.ru\//;

const YANDEX = /^https:\/\/([a-z0-9-]+\.)*yandex\.(ru|net|com)\//;

test.describe('как доехать', () => {
  test('до клика по карте нет ни одного запроса к api-maps.yandex.ru, после клика карта отрисовывается на точке поселения', async ({
    page,
  }) => {
    const requests: string[] = [];

    page.on('request', (request) => requests.push(request.url()));
    // карта — чужой сервис: тест проверяет, когда и что страница у него просит, а не работу самого Яндекса
    await page.route(YANDEX, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<title>Карта</title><div id="map" style="height: 100vh; background: #8a8a8a"></div>',
      }),
    );
    await page.goto(DIRECTIONS_PATH, { waitUntil: 'networkidle' });

    expect(requests.filter((url) => API_MAPS.test(url))).toEqual([]);
    expect(requests.filter((url) => YANDEX.test(url))).toEqual([]);
    await expect(page.locator('iframe')).toHaveCount(0);

    await page.getByRole('button', { name: 'Показать карту' }).click();

    const map = page.locator('[data-map] iframe');

    await expect(map).toBeVisible();

    const src = new URL((await map.getAttribute('src'))!);
    const box = await map.boundingBox();

    expect(src.hostname).toBe('yandex.ru');
    expect(src.searchParams.get('pt')).toContain(`${SITE.map.longitude},${SITE.map.latitude}`);
    expect(box && box.width > 200 && box.height > 200, 'карта нулевого размера').toBe(true);
    await expect(map.contentFrame().locator('#map')).toBeVisible();
  });

  test('на странице есть все части цели: адрес, кнопка карты, пять городов трансфера с точками сбора, цена, оповещение, автобусы и парковка', async ({
    page,
  }) => {
    await page.goto(DIRECTIONS_PATH);

    const main = page.locator('main');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(main).toContainText(SITE.address);
    await expect(page.getByRole('button', { name: 'Показать карту' })).toBeVisible();

    expect(TRANSFER_STOPS).toHaveLength(5);
    await expect(page.locator('#transfer-stops li')).toHaveCount(TRANSFER_STOPS.length);

    for (const { title, text } of TRANSFER_STOPS) {
      await expect(page.locator('#transfer-stops li').filter({ hasText: title })).toContainText(text);
    }

    await expect(page.locator('#transfer-price')).toContainText('600');
    await expect(page.locator('#transfer-stops')).toContainText(DEPARTURE_NOTICE);
    await expect(page.locator('#bus li')).toHaveCount(BUS_LINES.length);
    await expect(page.locator('#car')).toContainText(PARKING);
    // на трансфер ведет плашка главной: `/kak-doehat#transfer`
    await expect(page.locator('#transfer')).toBeVisible();
  });
});
