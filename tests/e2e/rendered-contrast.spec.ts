import { expect, test } from '@playwright/test';
import { BASE_URL, MIN_TEXT_NODES, THEME_COOKIE, THEMES, VIEWPORTS } from './consts';
import { describeFailure, measureRenderedContrast } from './rendered-contrast';

test.describe('контраст текста на отрисованной странице', () => {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`${theme}, ${viewport.name}: ни один текстовый узел не ниже 4,5:1`, async ({ page, context }) => {
        await context.addCookies([{ name: THEME_COOKIE, value: theme, url: BASE_URL }]);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const measurement = await measureRenderedContrast(page);

        expect(measurement.nodes).toBeGreaterThanOrEqual(MIN_TEXT_NODES);
        expect(measurement.failures.map(describeFailure)).toEqual([]);
      });
    }
  }
});
