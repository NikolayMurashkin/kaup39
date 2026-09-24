import { expect, test, type Page } from '@playwright/test';
import {
  FILE_FAMILY,
  FONT_DELAY,
  MAX_FALLBACK_DEVIATION,
  MAX_FONT_SWAP_SHIFT,
  MIN_TEXT_NODES,
  SHOWCASE_PATH,
  TEXT_FONT_TOKENS,
  VIEWPORTS,
} from './consts';
import { LONG_WORD } from './seed/data';
import type { NodeFonts } from './types';

const PAGES = ['/', SHOWCASE_PATH];

const PROBE = 'data-font-probe';

/**
 * Какими шрифтами Chrome на самом деле нарисовал текст каждого видимого узла. Вычисленный
 * `font-family` этого не скажет: он одинаков и тогда, когда шрифт не загрузился, и тогда, когда
 * в сабсете не нашлось одного знака и он ушел в запасную гарнитуру, — а `getPlatformFontsForNode`
 * перечисляет все шрифты, которыми набраны глифы узла. Вместе с текстом вложенных строчных
 * элементов: у цены число набрано Ponomar, а знак рубля во вложенном `span` — Golos Text, поэтому
 * узлу разрешены первые семейства его собственного текста и вложенного.
 */
const renderedFonts = async (page: Page): Promise<NodeFonts[]> => {
  const hosts = await page.evaluate((probe) => {
    const found = new Set<Element>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const host = text.parentElement;

      if (!text.nodeValue?.trim() || !host || !host.checkVisibility({ visibilityProperty: true })) continue;

      const range = document.createRange();

      range.selectNodeContents(text);

      if ([...range.getClientRects()].some((rect) => rect.width > 1 && rect.height > 1)) {
        found.add(host);
      }
    }

    const familyOf = (element: Element) =>
      getComputedStyle(element)
        .fontFamily.split(',')[0]
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2');

    return [...found].map((host, index) => {
      host.setAttribute(probe, String(index));

      return {
        text: (host.textContent ?? '').trim().slice(0, 40),
        family: familyOf(host),
        allowed: [...new Set([...found].filter((node) => host.contains(node)).map(familyOf))],
      };
    });
  }, PROBE);

  const cdp = await page.context().newCDPSession(page);

  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });

  return Promise.all(
    hosts.map(async (host, index) => {
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: `[${PROBE}="${index}"]`,
      });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });

      return { ...host, fonts: fonts.map(({ familyName, isCustomFont }) => ({ familyName, isCustomFont })) };
    }),
  );
};

test.describe('шрифты направления', () => {
  test('для первого семейства каждого текстового токена в CSS сборки объявлен @font-face с woff2', async ({ page }) => {
    await page.goto('/');

    const { families, faces } = await page.evaluate((tokens) => {
      const unquote = (value: string) => value.trim().replace(/^(['"])(.*)\1$/, '$2');
      const root = getComputedStyle(document.documentElement);

      return {
        families: tokens.map((token) => unquote(root.getPropertyValue(token).split(',')[0])),
        faces: [...document.styleSheets]
          .flatMap((sheet) => [...sheet.cssRules])
          .filter((rule): rule is CSSFontFaceRule => rule instanceof CSSFontFaceRule)
          .map((rule) => ({
            family: unquote(rule.style.getPropertyValue('font-family')),
            src: rule.style.getPropertyValue('src'),
          })),
      };
    }, TEXT_FONT_TOKENS);

    for (const family of families) {
      expect(
        faces.some((face) => face.family === family && /url\([^)]+\.woff2/.test(face.src)),
        `@font-face для ${family}`,
      ).toBe(true);
    }
  });

  for (const path of PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${path} на ${viewport.name}: каждый текстовый узел нарисован первым семейством своего токена`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(path);
        await page
          .locator('main details')
          .evaluateAll((nodes) => nodes.forEach((node) => node.setAttribute('open', '')));
        await page.evaluate(() => document.fonts.ready);

        const nodes = await renderedFonts(page);
        const fallen = nodes.filter(
          ({ family, allowed, fonts }) =>
            !fonts.some(({ familyName }) => familyName === FILE_FAMILY[family]) ||
            fonts.some(
              ({ familyName, isCustomFont }) =>
                !isCustomFont || !allowed.some((name) => FILE_FAMILY[name] === familyName),
            ),
        );

        expect(nodes.length).toBeGreaterThanOrEqual(MIN_TEXT_NODES);
        expect(fallen).toEqual([]);
      });
    }
  }
});

/**
 * Сумма сдвигов макета с первой отрисовки до прихода всех трех шрифтов. Lighthouse этого не видит:
 * на localhost шрифты уходят в preload и приезжают раньше первой отрисовки, так что запасные начертания
 * в его замер не попадают вовсе (проверено: с `size-adjust: 60%` у всех трех его CLS оставался 0).
 * Здесь ответы `.woff2` задерживаются, страница успевает нарисоваться запасными начертаниями, и замена
 * гарнитуры видна как сдвиг.
 */
const swapShift = async (page: Page, path: string) => {
  await page.addInitScript(() => {
    const target = window as unknown as { fontSwapShift: number };

    target.fontSwapShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) target.fontSwapShift += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.route('**/*.woff2', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, FONT_DELAY));
    await route.continue();
  });
  await page.goto(path, { waitUntil: 'domcontentloaded' });

  const families = await page.evaluate((tokens) => {
    const root = getComputedStyle(document.documentElement);

    return tokens.map((token) =>
      root
        .getPropertyValue(token)
        .split(',')[0]
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2'),
    );
  }, TEXT_FONT_TOKENS);

  const loadedBefore = await page.evaluate(
    (names) =>
      [...document.fonts].filter((face) => names.includes(face.family.replace(/"/g, '')) && face.status === 'loaded')
        .length,
    families,
  );

  await page.waitForFunction(
    (names) =>
      [...document.fonts].filter((face) => names.includes(face.family.replace(/"/g, '')) && face.status === 'loaded')
        .length === names.length,
    families,
  );
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 100)))),
  );

  return {
    loadedBefore,
    shift: await page.evaluate(() => (window as unknown as { fontSwapShift: number }).fontSwapShift),
  };
};

test.describe('пока грузятся шрифты направления', () => {
  for (const path of PAGES) {
    for (const viewport of VIEWPORTS) {
      test(`${path} на ${viewport.name}: замена запасных начертаний настоящими сдвигает макет не больше чем на ${MAX_FONT_SWAP_SHIFT}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);

        const { loadedBefore, shift } = await swapShift(page, path);

        expect(loadedBefore, 'страница нарисована до прихода шрифтов — иначе замер пустой').toBe(0);
        expect(shift).toBeLessThanOrEqual(MAX_FONT_SWAP_SHIFT);
      });
    }
  }
});

/**
 * Насколько метрическое запасное начертание расходится с настоящим шрифтом на тексте страницы — по каждой
 * гарнитуре отдельно, с учетом `text-transform`: ширина строки (`size-adjust`) и высота над и под базовой
 * линией (`ascent-override` и `descent-override`). Сумма сдвигов выше ловит только грубую ошибку: на Linux
 * числа next/font давали 0,017, совсем без запасных начертаний — 0,004, и оба проходят порог 0,02.
 *
 * Узлы с длинным словом засева в замер не входят: это нагрузка для теста переносов, а не текст. Одно
 * слово заглавными из восьмидесяти букв занимало треть текста Ponomar на главной засева и уводило
 * ширину на 2,6%, хотя на настоящем контенте та же гарнитура расходится на 0,9%.
 */
const fallbackMetrics = (page: Page) =>
  page.evaluate(async (stress) => {
    const texts: Record<string, string> = {};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const host = node.parentElement;

      if (!node.nodeValue?.trim() || node.nodeValue.includes(stress) || !host) continue;
      if (!host.checkVisibility({ visibilityProperty: true })) continue;

      const range = document.createRange();

      range.selectNodeContents(node);

      if (![...range.getClientRects()].some((rect) => rect.width > 1 && rect.height > 1)) continue;

      const style = getComputedStyle(host);
      const family = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      const text = node.nodeValue.replace(/\s+/g, ' ');

      texts[family] = (texts[family] ?? '') + (style.textTransform === 'uppercase' ? text.toUpperCase() : text);
    }

    const context = document.createElement('canvas').getContext('2d')!;

    const measure = (family: string, text: string) => {
      context.font = `100px "${family}"`;

      return context.measureText(text);
    };

    return Promise.all(
      Object.entries(texts).map(async ([family, text]) => {
        const fallback = `${family} Metric Fallback`;
        // начертание без единого найденного local() не загружается, а отклоняет промис
        const faces = await document.fonts.load(`100px "${fallback}"`, text).catch(() => null);
        const state =
          faces === null ? 'нет ни одного локального шрифта' : faces.length === 0 ? 'не объявлено' : 'loaded';
        const own = measure(family, text);
        const substitute = measure(fallback, text);

        return {
          family,
          state,
          ratios: {
            width: substitute.width / own.width,
            ascent: substitute.fontBoundingBoxAscent / own.fontBoundingBoxAscent,
            descent: substitute.fontBoundingBoxDescent / own.fontBoundingBoxDescent,
          },
        };
      }),
    );
  }, LONG_WORD);

test.describe('метрические запасные начертания', () => {
  for (const path of PAGES) {
    test(`${path}: текст запасным начертанием той же ширины и высоты, что настоящим шрифтом, ±${MAX_FALLBACK_DEVIATION * 100}%`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);

      const metrics = await fallbackMetrics(page);

      expect(metrics.map(({ family }) => family).sort()).toEqual(Object.keys(FILE_FAMILY).sort());

      for (const { family, state, ratios } of metrics) {
        expect(state, `${family} Metric Fallback`).toBe('loaded');

        for (const [metric, ratio] of Object.entries(ratios)) {
          expect(Math.abs(ratio - 1), `${family}, ${metric}: ${ratio.toFixed(4)}`).toBeLessThanOrEqual(
            MAX_FALLBACK_DEVIATION,
          );
        }
      }
    });
  }
});
