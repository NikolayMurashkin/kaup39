import type { Page } from '@playwright/test';
import sharp from 'sharp';
import { MIN_RATIO, TOLERANCE_PER_LINE } from './consts';
import { contrast, type Rgb } from '../lib/contrast';

export type TextNode = {
  selector: string;
  color: Rgb;
  rects: { x: number; y: number; w: number; h: number }[];
  runic: boolean;
};

export type Failure = TextNode & { worst: number; below: number; area: number };

export type Measurement = {
  nodes: number;
  /** Узлы, у которых кадры нигде не разошлись: глифов на странице не видно. */
  blind: number;
  failures: Failure[];
};

type Frame = { data: Buffer; width: number; height: number; channels: number };

/** Кадры съемки: обычный, с погашенным текстом и со спрятанными руническими надписями. */
const MASK = {
  none: '',
  text: 'body, body * { color: transparent !important; }',
  runes: 'svg[data-runic] { visibility: hidden !important; }',
};

/** Разница цвета между обычным кадром и кадром с погашенным текстом, после которой пиксель считается закрашенным. */
const PAINTED_DIFF = 90;

/** Меньше этой площади узел не меряется: одна-две точки не дают устойчивого результата. */
const MIN_AREA = 10;

const collect = (page: Page) =>
  page.evaluate(() => {
    const parse = (css: string) =>
      (css.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number) as [number, number, number];

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
      rects: { x: number; y: number; w: number; h: number }[];
      runic: boolean;
    }[] = [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Map<Element, { x: number; y: number; w: number; h: number }[]>();

    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      if (!text.nodeValue?.trim()) continue;

      const host = text.parentElement;

      if (!host || getComputedStyle(host).visibility === 'hidden') continue;

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
      nodes.push({ selector: pathOf(host), color: parse(getComputedStyle(host).color), rects, runic: false });
    }

    // рунические надписи — это текст, набранный своим алфавитом, и порог на них тоже распространяется;
    // гасить их вместе с остальным текстом нельзя: фаска буквы подменяет собой фон под ней
    for (const svg of document.querySelectorAll('svg[data-runic]')) {
      const box = svg.getBoundingClientRect();

      if (box.width < 2 || box.height < 2) continue;

      const face = svg.querySelector('.runic__face');

      if (!face) continue;

      nodes.push({
        selector: `${pathOf(svg)} (${(svg as SVGElement).dataset.runic ?? ''})`,
        color: parse(getComputedStyle(face).color),
        rects: [{ x: box.left + window.scrollX, y: box.top + window.scrollY, w: box.width, h: box.height }],
        runic: true,
      });
    }

    return nodes;
  });

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

const measureNodes = (plain: Frame, blanked: Record<'text' | 'runes', Frame>, nodes: TextNode[]): Measurement => {
  const failures: Failure[] = [];
  let blind = 0;
  let measured = 0;

  for (const node of nodes) {
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

          // контраст меряется к фону под каждым пикселем строки, а не только под ядром глифа:
          // текст, покрашенный в цвет фона, кадры нигде не разведут и маска окажется пустой
          const ratio = contrast(node.color, [
            background.data[offset],
            background.data[offset + 1],
            background.data[offset + 2],
          ]);

          if (ratio < worst) worst = ratio;
          if (ratio < MIN_RATIO) below++;
        }
      }
    }

    if (area < MIN_AREA) continue;

    measured++;

    if (painted < MIN_AREA) blind++;
    if (below > TOLERANCE_PER_LINE * node.rects.length) failures.push({ ...node, worst, below, area });
  }

  return { nodes: measured, blind, failures };
};

export const measureRenderedContrast = async (page: Page): Promise<Measurement> => {
  await page.evaluate(() => window.scrollTo(0, 0));

  const nodes = await collect(page);
  const plain = await shoot(page, 'none');
  const blanked = { text: await shoot(page, 'text'), runes: await shoot(page, 'runes') };

  return measureNodes(plain, blanked, nodes);
};

export const describeFailure = (failure: Failure) =>
  `${failure.selector} — худший пиксель ${failure.worst.toFixed(2)}:1, ниже порога ${failure.below} из ${failure.area} (строк ${failure.rects.length})`;
