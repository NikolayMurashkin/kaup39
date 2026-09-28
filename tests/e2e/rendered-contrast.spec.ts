import { expect, test } from '@playwright/test';
import { SITE_PAGES } from '../../src/lib/consts';
import { BASE_URL, MIN_PAGE_TEXT_NODES, THEME_COOKIE, THEMES, VIEWPORTS } from './consts';
import { describeFailure, measureRenderedContrast } from './rendered-contrast';

const NARROW = VIEWPORTS[1];

/** В меню все шесть страниц и главная. */
const MENU_LINKS_COUNT = SITE_PAGES.length + 1;

test.describe('контраст текста на отрисованной странице', () => {
  for (const [path, minNodes] of Object.entries(MIN_PAGE_TEXT_NODES)) {
    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        test(`${path}, ${theme}, ${viewport.name}: ни один текстовый узел не ниже 4,5:1`, async ({ page, context }) => {
          await context.addCookies([{ name: THEME_COOKIE, value: theme, url: BASE_URL }]);
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(path, { waitUntil: 'networkidle' });
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          // меню таверн раскрыто: свернутый текст не отрисован и иначе остался бы без замера
          await page
            .locator('main details')
            .evaluateAll((nodes) => nodes.forEach((node) => node.setAttribute('open', '')));

          const measurement = await measureRenderedContrast(page);

          expect(measurement.nodes).toBeGreaterThanOrEqual(minNodes[viewport.name]);
          // узел, у которого кадры нигде не разошлись, на странице не виден совсем:
          // текст под непрозрачной плашкой прошел бы порог молча
          expect(measurement.unloaded).toEqual([]);
          expect(measurement.blind).toEqual([]);
          expect(measurement.failures.map(describeFailure)).toEqual([]);
        });
      }
    }
  }

  for (const theme of THEMES) {
    test(`${theme}, ${NARROW.name}: раскрытое меню шапки не ниже 4,5:1`, async ({ page, context }) => {
      await context.addCookies([{ name: THEME_COOKIE, value: theme, url: BASE_URL }]);
      await page.setViewportSize(NARROW);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Меню', exact: true }).click();

      const measurement = await measureRenderedContrast(page, 'dialog[open]');

      expect(measurement.nodes).toBeGreaterThanOrEqual(MENU_LINKS_COUNT);
      expect(measurement.blind).toEqual([]);
      expect(measurement.failures.map(describeFailure)).toEqual([]);
    });
  }
});
