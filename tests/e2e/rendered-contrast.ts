import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { MASK, MIN_AREA, MIN_RATIO, PAINTED_DIFF, TOLERANCE_PER_LINE } from './consts';
import type { Failure, Frame, Measurement, TextNode } from './types';
import { contrast, type Rgb } from '../lib/contrast';

const PLATED_REASON =
  'текст на плашке со своим фоном под полупрозрачным предком: замер не умеет смешать его честно — убрать opacity у плашки';

const collect = (page: Page, scope: string) =>
  page.evaluate((scope) => {
    const parse = (css: string) =>
      (css.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number) as [number, number, number];

    // видимая плотность текста: собственная альфа цвета, умноженная на `opacity` самого узла и всех предков
    const alphaOf = (css: string, node: Element) => {
      let alpha = Number((css.match(/[\d.]+/g) ?? [])[3] ?? 1);

      for (let item: Element | null = node; item; item = item.parentElement) {
        alpha *= Number(getComputedStyle(item).opacity);
      }

      return alpha;
    };

    // плашка со своим фоном (или фоном псевдоэлемента) между текстом и полупрозрачным предком: кадр
    // без текста показывает ее уже смешанной с тем, что под предком, и честно смешать текст не с чем
    const painted = (element: Element, pseudo?: string) => {
      const style = getComputedStyle(element, pseudo);

      if (pseudo && style.content === 'none') return false;

      return Number((style.backgroundColor.match(/[\d.]+/g) ?? [])[3] ?? 1) > 0 || style.backgroundImage !== 'none';
    };

    const platedOf = (node: Element) => {
      let top: Element | null = null;

      for (let item: Element | null = node; item; item = item.parentElement) {
        if (Number(getComputedStyle(item).opacity) < 1) top = item;
      }

      for (let item: Element | null = node; top && item; item = item.parentElement) {
        if (painted(item) || painted(item, '::before') || painted(item, '::after')) return true;
        if (item === top) break;
      }

      return false;
    };

    const pathOf = (node: Element) => {
      const parts: string[] = [];

      for (let item: Element | null = node; item && item !== document.body; item = item.parentElement) {
        const name = String(
          (item as unknown as { className: { baseVal?: string } }).className?.baseVal ?? item.className ?? '',
        );

        parts.unshift(name ? `${item.tagName.toLowerCase()}.${name.split(' ')[0]}` : item.tagName.toLowerCase());
      }

      return parts.slice(-2).join('>');
    };

    const nodes: {
      selector: string;
      color: [number, number, number];
      alpha: number;
      plated: boolean;
      rects: { x: number; y: number; w: number; h: number }[];
      runic: boolean;
    }[] = [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Map<Element, { x: number; y: number; w: number; h: number }[]>();

    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      if (!text.nodeValue?.trim()) continue;

      const host = text.parentElement;

      // неотрисованный текст (в свернутом `<details>`, под `display: none`) не меряется: пикселей у него нет
      if (!host || !host.checkVisibility({ visibilityProperty: true }) || !host.closest(scope)) continue;

      const range = document.createRange();

      range.selectNodeContents(text);

      const rects = [...range.getClientRects()].filter((rect) => rect.width > 1 && rect.height > 1);

      if (!rects.length) continue;

      if (!seen.has(host)) seen.set(host, []);

      seen.get(host)?.push(
        ...rects.map((rect) => ({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          w: rect.width,
          h: rect.height,
        })),
      );
    }

    for (const [host, rects] of seen) {
      const color = getComputedStyle(host).color;

      nodes.push({
        selector: pathOf(host),
        color: parse(color),
        alpha: alphaOf(color, host),
        plated: platedOf(host),
        rects,
        runic: false,
      });
    }

    // рунические надписи — это текст, набранный своим алфавитом, и порог на них тоже распространяется;
    // гасить их вместе с остальным текстом нельзя: фаска буквы подменяет собой фон под ней
    for (const svg of document.querySelectorAll(`:is(${scope}) svg[data-runic]`)) {
      const box = svg.getBoundingClientRect();

      if (box.width < 2 || box.height < 2) continue;

      const face = svg.querySelector('.runic__face');

      if (!face) continue;

      nodes.push({
        selector: `${pathOf(svg)} (${(svg as SVGElement).dataset.runic ?? ''})`,
        color: parse(getComputedStyle(face).color),
        alpha: alphaOf(getComputedStyle(face).color, face),
        plated: platedOf(face),
        rects: [{ x: box.left + window.scrollX, y: box.top + window.scrollY, w: box.width, h: box.height }],
        runic: true,
      });
    }

    return nodes;
  }, scope);

const shoot = async (page: Page, mask: keyof typeof MASK): Promise<Frame> => {
  await page.evaluate((css) => {
    const style = document.createElement('style');

    style.id = 'measure-mask';
    style.textContent = css;
    document.head.append(style);
  }, MASK[mask]);

  await page.waitForTimeout(160);

  const buffer = await page.screenshot({ fullPage: true });

  await page.evaluate(() => document.getElementById('measure-mask')?.remove());

  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height, channels: info.channels };
};

const measureNodes = (
  plain: Frame,
  blanked: Record<'text' | 'runes', Frame>,
  nodes: TextNode[],
): Omit<Measurement, 'unloaded'> => {
  const failures: Failure[] = [];
  const blind: string[] = [];
  let measured = 0;

  for (const node of nodes) {
    if (node.plated) {
      failures.push({ ...node, worst: Number.NaN, below: 0, area: 0, reason: PLATED_REASON });
      continue;
    }

    const background = blanked[node.runic ? 'runes' : 'text'];
    let worst = Infinity;
    let below = 0;
    let painted = 0;
    let area = 0;

    for (const rect of node.rects) {
      const x0 = Math.max(0, Math.floor(rect.x));
      const y0 = Math.max(0, Math.floor(rect.y));
      const x1 = Math.min(plain.width, Math.ceil(rect.x + rect.w));
      const y1 = Math.min(plain.height, Math.ceil(rect.y + rect.h));

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const offset = (y * plain.width + x) * plain.channels;

          area++;

          const diff =
            Math.abs(plain.data[offset] - background.data[offset]) +
            Math.abs(plain.data[offset + 1] - background.data[offset + 1]) +
            Math.abs(plain.data[offset + 2] - background.data[offset + 2]);

          if (diff >= PAINTED_DIFF) painted++;

          const under: Rgb = [background.data[offset], background.data[offset + 1], background.data[offset + 2]];

          // контраст меряется к фону под каждым пикселем строки, а не только под ядром глифа:
          // текст, покрашенный в цвет фона, кадры нигде не разведут и маска окажется пустой.
          // Полупрозрачный текст сначала смешивается с этим фоном: глаз видит смесь, а не цвет из CSS
          const ratio = contrast(
            node.color.map((channel, index) => node.alpha * channel + (1 - node.alpha) * under[index]) as Rgb,
            under,
          );

          if (ratio < worst) worst = ratio;
          if (ratio < MIN_RATIO) below++;
        }
      }
    }

    if (area < MIN_AREA) continue;

    measured++;

    if (painted < MIN_AREA) blind.push(node.selector);
    if (below > TOLERANCE_PER_LINE * node.rects.length) failures.push({ ...node, worst, below, area });
  }

  return { nodes: measured, blind, failures };
};

/** `scope` — селектор части страницы, чьи узлы меряются: например, раскрытое меню шапки. */
export const measureRenderedContrast = async (page: Page, scope = 'body'): Promise<Measurement> => {
  await page.evaluate(() => window.scrollTo(0, 0));

  // ленивые кадры ниже экрана полностраничный снимок сам не грузит: текст над ними мерился бы поверх
  // заглушки, поэтому все кадры грузятся заранее, а незагруженный роняет тест
  const unloaded = await page.evaluate(async () => {
    const images = [...document.images];

    images.forEach((image) => {
      image.loading = 'eager';
    });
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));

    return images.filter((image) => !image.complete || !image.naturalWidth).map((image) => image.src);
  });
  const nodes = await collect(page, scope);
  const plain = await shoot(page, 'none');
  const blanked = { text: await shoot(page, 'text'), runes: await shoot(page, 'runes') };

  return { ...measureNodes(plain, blanked, nodes), unloaded };
};

export const describeFailure = (failure: Failure) =>
  failure.reason
    ? `${failure.selector} — ${failure.reason}`
    : `${failure.selector} — худший пиксель ${failure.worst.toFixed(2)}:1, ниже порога ${failure.below} из ${failure.area} (строк ${failure.rects.length})`;
