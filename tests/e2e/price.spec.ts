import { expect, test } from '@playwright/test';
import { BASE_URL, MIN_PRICES, SHOWCASE_PATH, THEME_COOKIE, THEMES, VIEWPORTS } from './consts';

/**
 * Замеряется отрисованная страница, а не CSS: оба дефекта цены в артборде выглядели в исходнике
 * корректно и ловились только геометрией — знак рубля уезжал на свою строку, потому что глобальный
 * `overflow-wrap: anywhere` разрешает разрыв даже на неразрывном пробеле.
 */
const priceLines = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-price]')].map((price) => {
      const rub = price.querySelector('[data-rub]');
      const range = document.createRange();

      range.setStart(price, 0);

      if (rub) {
        range.setEndAfter(rub);
      } else {
        range.setEndAfter(price);
      }

      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);

      // одна строка — это когда у всех прямоугольников есть общая горизонтальная полоса.
      // Сравнивать верхние края нельзя: у знака рубля свой кегль, и его строчный бокс выше
      // числа даже тогда, когда они стоят рядом
      const band = rects.reduce(
        (common, rect) => ({ top: Math.max(common.top, rect.top), bottom: Math.min(common.bottom, rect.bottom) }),
        { top: -Infinity, bottom: Infinity },
      );

      return {
        text: range.toString().trim(),
        hasRub: Boolean(rub),
        oneLine: rects.length > 0 && band.top < band.bottom,
      };
    }),
  );

test.describe('цена не разрывается между числом и знаком рубля', () => {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`${theme}, ${viewport.name}: каждая цена витрины набрана одной строкой`, async ({ page, context }) => {
        await context.addCookies([{ name: THEME_COOKIE, value: theme, url: BASE_URL }]);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(SHOWCASE_PATH);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const prices = await priceLines(page);

        expect(prices.length).toBeGreaterThanOrEqual(MIN_PRICES);
        expect(prices.every((price) => price.hasRub)).toBe(true);
        expect(prices.filter((price) => !price.oneLine)).toEqual([]);
      });
    }
  }
});
