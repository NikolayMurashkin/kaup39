import { expect, test } from '@playwright/test';
import artboard from '../fixtures/artboard-tokens.json';
import { BASE_URL, NARROW_BREAKPOINT, THEME_COOKIE, VIEWPORTS } from './consts';

/** Записано буквой, а не константой кода: «один язык, темная основная» — это решение, а не переменная. */
const MAIN_THEME = 'dark';

const LANG = 'ru';

const SIZES = Object.keys(artboard.css.narrow).filter((name) => name.startsWith('--size-'));

/**
 * Ширины по обе стороны границы: на самом брейкпоинте действует узкая колонка, на пиксель шире —
 * широкая. Пары ширин артборда (390 и 1440) для этого мало: она оставляет верным любое число
 * между ними, и подмена `640px` на `800px` прошла бы молча.
 */
const WIDTHS = [
  { width: VIEWPORTS[1].width, column: 'narrow' },
  { width: NARROW_BREAKPOINT, column: 'narrow' },
  { width: NARROW_BREAKPOINT + 1, column: 'wide' },
  { width: VIEWPORTS[0].width, column: 'wide' },
] as const;

/** Широкая колонка живет в блоке `dark` снимка: там же лежат размеры по умолчанию. */
const COLUMN_GROUP = { narrow: 'narrow', wide: 'dark' } as const;

const expectedSizes = (column: 'narrow' | 'wide') => {
  const group = COLUMN_GROUP[column];

  return Object.fromEntries(
    SIZES.map((name) => [name, artboard.css[group][name as keyof (typeof artboard.css)[typeof group]]]),
  );
};

test.describe('оболочка страницы', () => {
  test('страница на одном языке — русском', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('lang', LANG);
  });

  test('без куки страница отдает основную тему', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', MAIN_THEME);
  });

  test('неизвестное значение куки дает основную тему', async ({ page, context }) => {
    await context.addCookies([{ name: THEME_COOKIE, value: 'sepia', url: BASE_URL }]);
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', MAIN_THEME);
  });

  test('размеры переключаются ровно на брейкпоинте узкой колонки', async ({ page }) => {
    for (const { width, column } of WIDTHS) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');

      const applied = await page.evaluate((names) => {
        const style = getComputedStyle(document.documentElement);

        return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]));
      }, SIZES);

      expect(applied, `ширина ${width}`).toEqual(expectedSizes(column));
    }
  });
});
