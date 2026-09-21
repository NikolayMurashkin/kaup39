import { expect, test } from '@playwright/test';
import artboard from '../fixtures/artboard-tokens.json';
import { BASE_URL, THEME_COOKIE, VIEWPORTS } from './consts';

/** Записано буквой, а не константой кода: «темная основная, светлая вторая» — это решение, а не переменная. */
const MAIN_THEME = 'dark';

test.describe('оболочка страницы', () => {
  test('без куки страница отдает основную тему', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', MAIN_THEME);
  });

  test('неизвестное значение куки дает основную тему', async ({ page, context }) => {
    await context.addCookies([{ name: THEME_COOKIE, value: 'sepia', url: BASE_URL }]);
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', MAIN_THEME);
  });

  test('на узкой ширине действуют размеры узкой колонки артборда, на широкой — широкой', async ({ page }) => {
    const sizes = Object.keys(artboard.css.narrow).filter((name) => name.startsWith('--size-'));

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      const applied = await page.evaluate((names) => {
        const style = getComputedStyle(document.documentElement);

        return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]));
      }, sizes);

      const expected = Object.fromEntries(
        sizes.map((name) => [
          name,
          viewport.name === '390'
            ? artboard.css.narrow[name as keyof typeof artboard.css.narrow]
            : artboard.css.dark[name as keyof typeof artboard.css.dark],
        ]),
      );

      expect(applied, `ширина ${viewport.name}`).toEqual(expected);
    }
  });
});
