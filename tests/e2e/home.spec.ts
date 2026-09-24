import { expect, test, type Page } from '@playwright/test';
import { HOME_ANCHORS } from '../../src/cms/consts';
import { MIN_LONG_TEXT_NODES, VIEWPORTS } from './consts';
import {
  FUTURE_OFFSETS,
  HOME,
  LONG_WORD,
  PAST_OFFSETS,
  settlementToday,
  shiftDay,
  SITE,
  TAVERNS,
  ZONES,
} from './seed/data';

const upcomingDays = (page: Page, selector: string) =>
  page.locator(`${selector} time[datetime]`).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime')));

test.describe('главная', () => {
  test('в блоке ближайших событий только даты, которые еще не прошли, по порядку от ближайшей', async ({ page }) => {
    await page.goto('/');

    const today = settlementToday();
    const future = FUTURE_OFFSETS.map((offset) => shiftDay(today, offset));
    const past = PAST_OFFSETS.map((offset) => shiftDay(today, offset));
    const all = await upcomingDays(page, '[data-upcoming]');
    const next = await upcomingDays(page, '[data-upcoming="next"]');
    const strip = await upcomingDays(page, '[data-upcoming="dates"]');

    expect(all.length).toBeGreaterThan(0);
    expect(all.filter((day) => !day || day < today)).toEqual([]);
    expect(all.filter((day) => past.includes(day!))).toEqual([]);
    expect(next).toEqual([future[0]]);
    expect(strip.length).toBeGreaterThanOrEqual(3);
    expect(strip).toEqual(future.slice(0, strip.length));
  });

  test('на странице нет ни одной href="#", а каждая ссылка на раздел ведет на существующий якорь', async ({ page }) => {
    await page.goto('/');

    const { hrefs, missing } = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')].map((link) => link.getAttribute('href') ?? '');

      return {
        hrefs: links,
        missing: links
          .filter((href) => /^\/?#./.test(href))
          .filter((href) => !document.getElementById(decodeURIComponent(href.split('#')[1]))),
      };
    });

    expect(hrefs.length).toBeGreaterThan(10);
    expect(hrefs.filter((href) => href === '#' || href === '')).toEqual([]);
    expect(missing).toEqual([]);
  });

  test('390: длинный текст из CMS не выходит за контейнер и горизонтального скролла документа нет', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[1]);
    await page.goto('/');
    // меню таверн и мобильное меню раскрываются: свернутый текст не отрисован и не проверялся бы
    await page.locator('details').evaluateAll((nodes) => nodes.forEach((node) => node.setAttribute('open', '')));

    const result = await page.evaluate((word) => {
      const width = document.documentElement.clientWidth;
      const clips = (element: Element) => {
        const style = getComputedStyle(element);

        return style.overflowX !== 'visible' || style.clipPath !== 'none';
      };
      const describe = (element: Element) => `${element.tagName.toLowerCase()}.${element.className}`;
      const escaped: string[] = [];
      let longNodes = 0;

      const check = (host: Element, rects: DOMRect[], label: string) => {
        for (const rect of rects) {
          if (rect.left < -0.5 || rect.right > width + 0.5) escaped.push(`${label}: за краем окна`);

          // обход начинается с самого узла: у кнопки и подписи кадра срез стоит на элементе с текстом
          for (let parent: Element | null = host; parent && parent !== document.body; parent = parent.parentElement) {
            if (!clips(parent)) continue;

            const box = parent.getBoundingClientRect();

            if (rect.left < box.left - 0.5 || rect.right > box.right + 0.5) {
              escaped.push(`${label}: обрезан контейнером ${describe(parent)}`);
            }
          }
        }
      };

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        const host = text.parentElement;

        if (!text.nodeValue?.trim() || !host || !host.checkVisibility({ visibilityProperty: true })) continue;

        const range = document.createRange();

        range.selectNodeContents(text);

        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);

        if (!rects.length) continue;
        if (text.nodeValue.includes(word)) longNodes++;

        check(host, rects, `«${text.nodeValue.trim().slice(0, 30)}»`);
      }

      for (const svg of document.querySelectorAll('svg[data-runic]')) {
        check(svg, [svg.getBoundingClientRect()], `руны «${(svg as SVGElement).dataset.runic?.slice(0, 30)}»`);
      }

      return {
        escaped: [...new Set(escaped)],
        longNodes,
        scrollWidth: document.documentElement.scrollWidth,
        width,
      };
    }, LONG_WORD);

    expect(result.longNodes).toBeGreaterThanOrEqual(MIN_LONG_TEXT_NODES);
    expect(result.scrollWidth).toBeLessThanOrEqual(result.width);
    expect(result.escaped).toEqual([]);
  });

  test('переключатель темы меняет тему сразу и запоминает ее в куке', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: 'Включить светлую тему' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Включить темную тему' })).toBeVisible();

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('на главной есть все части цели: площадки, таверны с меню, кемпинг, аренда, трансфер и контакты', async ({
    page,
  }) => {
    const blocks = (type: string) => HOME.sections.filter((section) => section.blockType === type);
    const camping = `#${HOME_ANCHORS.camping}`;

    await page.goto('/');

    // семь площадок и восьмая плитка — таверны
    await expect(page.locator(`#${HOME_ANCHORS.zones} li`)).toHaveCount(ZONES.length + 1);
    await expect(page.locator(`#${HOME_ANCHORS.kitchen} article`)).toHaveCount(TAVERNS.length);
    await expect(page.locator(`#${HOME_ANCHORS.kitchen} details`)).toHaveCount(
      TAVERNS.filter((tavern) => tavern.menu).length,
    );
    await expect(page.locator(`${camping} dl > div`)).toHaveCount(blocks('prices')[0].rows?.length ?? 0);
    await expect(page.locator(`${camping} li`)).toHaveCount(blocks('list')[0].items?.length ?? 0);
    await expect(page.locator('#rent-prices')).toContainText('5000');
    await expect(page.getByRole('link', { name: 'Точки сбора и\u00a0время отправления' })).toHaveAttribute(
      'href',
      '/kak-doehat#transfer',
    );
    await expect(page.locator('footer')).toContainText(SITE.phone);
    await expect(page.locator('footer')).toContainText(SITE.email);
  });
});
