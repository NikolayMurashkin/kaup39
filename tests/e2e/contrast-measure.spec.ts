import { expect, test } from '@playwright/test';
import { contrast, type Rgb } from '../lib/contrast';
import { MIN_RATIO } from './consts';
import { measureRenderedContrast } from './rendered-contrast';

const TEXT: Rgb = [242, 230, 208];
const CANVAS: Rgb = [15, 13, 11];
const ALPHA = 0.35;

/** Цвет, который глаз видит у текста с прозрачностью `alpha` на фоне `background`. */
const composite = (alpha: number): Rgb =>
  TEXT.map((channel, index) => Math.round(alpha * channel + (1 - alpha) * CANVAS[index])) as Rgb;

const page = (body: string) => `
  <body style="margin: 0; padding: 24px; background: rgb(${CANVAS}); font: 28px/1.5 Arial, sans-serif">
    <p class="opaque" style="color: rgb(${TEXT})">Непрозрачный текст на темном фоне</p>
    ${body}
  </body>`;

/**
 * Замер проверяется на странице, где правильный ответ известен заранее: светлый текст на саже дает около
 * 15:1, а тот же текст с прозрачностью 0.35 или под предком с `opacity: 0.35` — около 3:1. Раньше замер брал
 * первые три числа цвета и видел в обоих случаях 15:1, то есть пропускал полупрозрачный текст.
 */
test.describe('замер контраста учитывает прозрачность текста', () => {
  const expected = contrast(composite(ALPHA), CANVAS);

  test('альфа в цвете самого текста', async ({ page: browser }) => {
    await browser.setContent(page(`<p class="alpha" style="color: rgba(${TEXT}, ${ALPHA})">Полупрозрачный текст</p>`));

    const { failures } = await measureRenderedContrast(browser);

    expect(expected).toBeLessThan(MIN_RATIO);
    expect(failures.map((failure) => failure.selector)).toEqual(['p.alpha']);
    expect(failures[0].worst).toBeCloseTo(expected, 1);
  });

  test('opacity предков складывается с альфой текста', async ({ page: browser }) => {
    await browser.setContent(
      page(`<div class="veil" style="opacity: 0.7"><div style="opacity: 0.5">
        <p class="inside" style="color: rgb(${TEXT})">Текст под двумя полупрозрачными предками</p>
      </div></div>`),
    );

    const { failures } = await measureRenderedContrast(browser);

    expect(failures.map((failure) => failure.selector)).toEqual(['div>p.inside']);
    expect(failures[0].worst).toBeCloseTo(expected, 1);
  });

  // смешивать цвет текста с кадром без текста здесь нельзя: в этом кадре фон плашки уже положен
  // с прозрачностью, а текст смешивается с тем, что лежит под плашкой, — замер вышел бы оптимистичным
  test('плашка со своим фоном под полупрозрачным предком — явный провал, а не оптимистичный замер', async ({
    page: browser,
  }) => {
    await browser.setContent(
      page(`<div class="plate" style="opacity: 0.6; background: rgb(85, 85, 85); padding: 12px">
        <p class="on-plate" style="color: rgb(${TEXT})">Текст на полупрозрачной плашке</p>
      </div>
      <style>.cut { position: relative; opacity: 0.9; padding: 12px } .cut::before { content: ''; position: absolute;
        inset: 0; z-index: -1; background: rgb(85, 85, 85) }</style>
      <div class="cut"><p class="on-cut" style="color: rgb(${TEXT})">Фон плашки нарисован псевдоэлементом</p></div>`),
    );

    const { failures } = await measureRenderedContrast(browser);

    expect(failures.map((failure) => [failure.selector, failure.reason])).toEqual([
      ['div.plate>p.on-plate', expect.stringContaining('полупрозрачн')],
      ['div.cut>p.on-cut', expect.stringContaining('полупрозрачн')],
    ]);
  });
});
