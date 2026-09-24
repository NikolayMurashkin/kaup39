import { expect, test } from '@playwright/test';
import { NAV_LINKS } from '../../src/lib/consts';
import { BASE_URL, MIN_HOME_TEXT_NODES, THEME_COOKIE, THEMES, VIEWPORTS } from './consts';
import { describeFailure, measureRenderedContrast } from './rendered-contrast';

const NARROW = VIEWPORTS[1];

const NAV_LINKS_COUNT = NAV_LINKS.length;

test.describe('контраст текста на отрисованной странице', () => {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`${theme}, ${viewport.name}: ни один текстовый узел не ниже 4,5:1`, async ({ page, context }) => {
        await context.addCookies([{ name: THEME_COOKIE, value: theme, url: BASE_URL }]);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        // меню таверн раскрыто: свернутый текст не отрисован и иначе остался бы без замера
        await page
          .locator('main details')
          .evaluateAll((nodes) => nodes.forEach((node) => node.setAttribute('open', '')));

        const measurement = await measureRenderedContrast(page);

        expect(measurement.nodes).toBeGreaterThanOrEqual(MIN_HOME_TEXT_NODES[viewport.name]);
        // узел, у которого кадры нигде не разошлись, на странице не виден совсем:
        // текст под непрозрачной плашкой прошел бы порог молча
        expect(measurement.unloaded).toEqual([]);
        expect(measurement.blind).toEqual([]);
        expect(measurement.failures.map(describeFailure)).toEqual([]);
      });
    }
  }

  for (const theme of THEMES) {
    test(`${theme}, ${NARROW.name}: раскрытое меню шапки не ниже 4,5:1`, async ({ page, context }) => {
      await context.addCookies([{ name: THEME_COOKIE, value: theme, url: BASE_URL }]);
      await page.setViewportSize(NARROW);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.locator('header details summary').click();

      const measurement = await measureRenderedContrast(page, 'header details');

      expect(measurement.nodes).toBeGreaterThanOrEqual(NAV_LINKS_COUNT);
      expect(measurement.blind).toEqual([]);
      expect(measurement.failures.map(describeFailure)).toEqual([]);
    });
  }
});
