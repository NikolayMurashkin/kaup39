#!/usr/bin/env node
/**
 * Метрики запасных начертаний `'<Семейство> Metric Fallback'` для `src/styles/tokens.scss`.
 *
 * Пока шрифт направления грузится, текст рисуется локальным шрифтом, подогнанным под него
 * `size-adjust` и `ascent`/`descent`-override, — иначе после загрузки строки переносятся иначе и
 * макет прыгает. next/font считает `size-adjust` по средней ширине английских букв, а текст «Каупа»
 * русский: у Forum, которым набрана только капитель, next дает 100,6%, а по кириллице выходит 85,8%,
 * и абзац на 390 до загрузки шрифта переносился лишней строкой. Поэтому ширина здесь меряется
 * на тексте артборда, разложенном по гарнитурам (с учетом `text-transform`), а вертикальные метрики
 * берутся из самого шрифта — те же числа, что у next/font.
 *
 * Артборд в git не входит, поэтому скрипт работает только на маке. Вывод — готовые `@font-face`
 * для начала `tokens.scss`. Проверка результата — `tests/e2e/fonts.spec.ts`, «метрические запасные начертания».
 *
 * Запуск: yarn fallback:metrics [путь до Kaup.dc.html]
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFAULT_ARTBOARD } from './sync-artboard-tokens.mts';

type Fallback = {
  family: string;
  file: string;
  /**
   * Шрифт, под который подгоняются метрики. Liberation на Linux метрически совпадает с ним, поэтому
   * подгонка точна и там; Noto Serif и Roboto на Android — ближайшая замена, там она приблизительная.
   */
  base: string;
  locals: string[];
};

const FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'styles', 'fonts');

const SERIF = ['Times New Roman', 'Liberation Serif', 'Noto Serif'];

const SANS = ['Arial', 'Liberation Sans', 'Roboto'];

const FALLBACKS: Fallback[] = [
  { family: 'Ponomar', file: 'ponomar.woff2', base: 'Times New Roman', locals: SERIF },
  { family: 'Forum', file: 'forum.woff2', base: 'Times New Roman', locals: SERIF },
  { family: 'Golos Text', file: 'golos-text.woff2', base: 'Arial', locals: SANS },
];

/** Служебные части артборда: таблица токенов и панель переключателей — не текст страниц. */
const SERVICE_PARTS = '.tokens, .controls';

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

const main = async () => {
  const artboard = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_ARTBOARD;
  const browser = await chromium.launch();

  const board = await browser.newPage();

  await board.goto(pathToFileURL(artboard).href);

  const corpus = await board.evaluate(
    ({ families, service }) => {
      const texts = Object.fromEntries(families.map((family) => [family, '']));
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const host = node.parentElement;

        if (!host || !node.nodeValue?.trim() || host.closest(service)) continue;

        const style = getComputedStyle(host);
        const family = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
        const text = node.nodeValue.replace(/\s+/g, ' ');

        if (family in texts) {
          texts[family] += style.textTransform === 'uppercase' ? text.toUpperCase() : text;
        }
      }

      return texts;
    },
    { families: FALLBACKS.map(({ family }) => family), service: SERVICE_PARTS },
  );

  const page = await browser.newPage();
  const faces = FALLBACKS.map(
    ({ family, file }) =>
      `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${readFileSync(join(FONTS_DIR, file)).toString('base64')})}`,
  );

  await page.setContent(`<style>${faces.join('')}</style>`);

  const metrics = await page.evaluate(
    async ({ fallbacks, texts }) => {
      const SIZE = 1000;
      const context = document.createElement('canvas').getContext('2d')!;

      const measure = (family: string, text: string) => {
        context.font = `${SIZE}px '${family}'`;

        return context.measureText(text);
      };

      return Promise.all(
        fallbacks.map(async ({ family, base }) => {
          await document.fonts.load(`${SIZE}px '${family}'`);

          const own = measure(family, texts[family]);

          return {
            family,
            sizeAdjust: own.width / measure(base, texts[family]).width,
            ascent: own.fontBoundingBoxAscent / SIZE,
            descent: own.fontBoundingBoxDescent / SIZE,
            characters: texts[family].length,
          };
        }),
      );
    },
    { fallbacks: FALLBACKS, texts: corpus },
  );

  await browser.close();

  for (const { family, sizeAdjust, ascent, descent, characters } of metrics) {
    const { locals } = FALLBACKS.find((fallback) => fallback.family === family)!;

    console.log(`/* ${family}: текст артборда, знаков — ${characters} */`);
    console.log(`@font-face {
  font-family: '${family} Metric Fallback';
  src: ${locals.map((name) => `local('${name}')`).join(', ')};
  ascent-override: ${percent(ascent / sizeAdjust)};
  descent-override: ${percent(descent / sizeAdjust)};
  line-gap-override: 0%;
  size-adjust: ${percent(sizeAdjust)};
}
`);
  }
};

await main();
