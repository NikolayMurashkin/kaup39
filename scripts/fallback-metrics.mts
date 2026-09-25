#!/usr/bin/env node
/**
 * Метрики запасных начертаний `'<Семейство> Metric Fallback'` для `src/styles/tokens.scss`.
 *
 * Пока шрифт направления грузится, текст рисуется локальным шрифтом, подогнанным под него
 * `size-adjust` и `ascent`/`descent`-override, — иначе после загрузки строки переносятся иначе и
 * макет прыгает. next/font считает `size-adjust` по средней ширине английских букв, а текст «Каупа»
 * русский: у Forum, которым набрана только капитель, next дает 100,6%, а по кириллице выходит 85,8%,
 * и абзац на 390 до загрузки шрифта переносился лишней строкой.
 *
 * Ширина подгоняется по эталонным текстам (`tests/lib/fallback-texts.ts`): текст артборда по гарнитурам
 * с учетом `text-transform`, все даты словами форматтера, числа месяца, суммы засева — и по видимому тексту
 * страниц с настоящим контентом, переданных через `--page`, взятому так же, как его берет тест (без дат
 * и длинного слова засева). Страницы засева в подгонку не передаются: по ним тест проверяет метрики, и если
 * бы они же метрики задавали, проверка перестала бы быть независимой, а выдуманный текст засева решал бы,
 * какой шрифт увидит посетитель.
 *
 * У каждой гарнитуры два начертания: все, кроме цифр, и цифры (`unicode-range: U+30-39`) — цифры запасного
 * шрифта отличаются от цифр гарнитур сильнее, чем буквы, и одним `size-adjust` даты и цены не сходились
 * с текстом. Пара `size-adjust` выбирается так, чтобы худшее отклонение по всем эталонным текстам было
 * наименьшим. Вертикальные метрики берутся из самого шрифта — те же числа, что у next/font, —
 * и пересчитываются на `size-adjust` каждого начертания, чтобы высота строки у обоих была одна.
 *
 * Мерить надо на крупном кегле (`FONT_MEASURE_SIZE`, тот же у теста): на Linux Chrome округляет ширину
 * глифов до пикселя, и на 100px это давало до 1% расхождения с маком на метрически равных шрифтах.
 *
 * Артборд в git не входит, поэтому скрипт работает только на маке. Он же записывает текст артборда
 * в `tests/fixtures/artboard-text.json` — по нему сверку ведут тесты на CI. Вывод — готовые `@font-face`
 * для начала `tokens.scss` и отклонение на каждом эталонном тексте. Проверка результата —
 * `tests/e2e/fonts.spec.ts`, «метрические запасные начертания».
 *
 * Запуск: yarn fallback:metrics [путь до Kaup.dc.html] [--page <адрес страницы> ...]
 * Страница — главная с настоящим контентом, `yarn dev` на рабочей базе: --page http://localhost:3000/
 */
import { chromium, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FONT_MEASURE_SIZE } from '../tests/e2e/consts';
import { LONG_WORD } from '../tests/e2e/seed/data';
import {
  collectTexts,
  DIGITS_RANGE,
  referenceTexts,
  type ArtboardText,
  type ReferenceText,
} from '../tests/lib/fallback-texts';
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

type TextWidths = {
  kind: string;
  /** Ширина текста настоящим шрифтом. */
  own: number;
  /** Ширина запасным шрифтом без `size-adjust`: все, кроме цифр, и отдельно цифры. */
  rest: number;
  digits: number;
};

type Measured = {
  family: string;
  ascent: number;
  descent: number;
  texts: TextWidths[];
};

const HERE = dirname(fileURLToPath(import.meta.url));

const FONTS_DIR = join(HERE, '..', 'src', 'styles', 'fonts');

const SNAPSHOT = join(HERE, '..', 'tests', 'fixtures', 'artboard-text.json');

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

/** Текст только тех гарнитур, у которых есть запасное начертание, — у каждой, даже пустой. */
const pick = (texts: Record<string, string>) =>
  Object.fromEntries(FALLBACKS.map(({ family }) => [family, texts[family] ?? '']));

/**
 * tsx собирает скрипт esbuild с `keepNames` и оборачивает функции в `__name(...)` — и те, что уходят
 * в `page.evaluate`. В браузере такой функции нет, поэтому страница получает свою, ничего не делающую.
 */
const allowKeptNames = (page: Page) => page.evaluate('globalThis.__name = (target) => target');

/** Худшее отклонение ширины запасного начертания от настоящего по всем текстам. */
const worstDeviation = (texts: TextWidths[], rest: number, digits: number) =>
  Math.max(...texts.map((text) => Math.abs((rest * text.rest + digits * text.digits) / text.own - 1)));

/** Минимум выпуклой функции на отрезке. */
const argmin = (score: (value: number) => number, from = 0.5, to = 1.5) => {
  let [low, high] = [from, to];

  for (let step = 0; step < 100; step += 1) {
    const left = low + (high - low) / 3;
    const right = high - (high - low) / 3;

    [low, high] = score(left) < score(right) ? [low, right] : [left, high];
  }

  return (low + high) / 2;
};

/** Пара `size-adjust` (все, кроме цифр, и цифры) с наименьшим худшим отклонением: оно выпукло по обеим. */
const fitSizeAdjust = (texts: TextWidths[]) => {
  const restFor = (digits: number) => argmin((rest) => worstDeviation(texts, rest, digits));
  const digits = argmin((value) => worstDeviation(texts, restFor(value), value));

  return { rest: restFor(digits), digits };
};

const fontFace = (family: string, locals: string[], ascent: number, descent: number, sizeAdjust: number) => [
  `  font-family: '${family} Metric Fallback';`,
  `  src: ${locals.map((name) => `local('${name}')`).join(', ')};`,
  `  ascent-override: ${percent(ascent / sizeAdjust)};`,
  `  descent-override: ${percent(descent / sizeAdjust)};`,
  '  line-gap-override: 0%;',
  `  size-adjust: ${percent(sizeAdjust)};`,
];

const main = async () => {
  const args = process.argv.slice(2);
  const pages = args.flatMap((arg, index) => (args[index - 1] === '--page' ? [arg] : []));
  const artboardArg = args.find((arg, index) => arg !== '--page' && args[index - 1] !== '--page');
  const artboard = artboardArg ? resolve(artboardArg) : DEFAULT_ARTBOARD;
  const browser = await chromium.launch();

  const board = await browser.newPage();

  await board.goto(pathToFileURL(artboard).href);
  await allowKeptNames(board);

  const snapshot: ArtboardText = {
    sha256: createHash('sha256').update(readFileSync(artboard)).digest('hex'),
    texts: pick(await board.evaluate(collectTexts, { skip: SERVICE_PARTS, onPage: false, stress: LONG_WORD })),
  };

  writeFileSync(SNAPSHOT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  const references: Record<string, ReferenceText[]> = Object.fromEntries(
    FALLBACKS.map(({ family }) => [family, referenceTexts(family, snapshot.texts)]),
  );

  for (const url of pages) {
    await board.goto(url);
    await allowKeptNames(board);
    await board.evaluate(() => document.fonts.ready);

    const texts = pick(await board.evaluate(collectTexts, { skip: null, onPage: true, stress: LONG_WORD }));

    for (const { family } of FALLBACKS) {
      if (texts[family].trim()) references[family].push({ kind: url, text: texts[family] });
    }
  }

  const page = await browser.newPage();
  const faces = FALLBACKS.map(
    ({ family, file }) =>
      `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${readFileSync(join(FONTS_DIR, file)).toString('base64')})}`,
  );

  await page.setContent(`<style>${faces.join('')}</style>`);
  await allowKeptNames(page);

  const measured: Measured[] = await page.evaluate(
    async ({ fallbacks, references, size }) => {
      const context = document.createElement('canvas').getContext('2d')!;

      const measure = (family: string, text: string) => {
        context.font = `${size}px '${family}'`;

        return context.measureText(text);
      };

      return Promise.all(
        fallbacks.map(async ({ family, base }) => {
          const texts = references[family];

          await document.fonts.load(`${size}px '${family}'`, texts.map(({ text }) => text).join(''));

          const { fontBoundingBoxAscent, fontBoundingBoxDescent } = measure(family, texts[0].text);

          return {
            family,
            ascent: fontBoundingBoxAscent / size,
            descent: fontBoundingBoxDescent / size,
            texts: texts.map(({ kind, text }) => {
              const runs = text.match(/[0-9]+|[^0-9]+/g) ?? [];
              const width = (digits: boolean) =>
                runs
                  .filter((run) => /^[0-9]/.test(run) === digits)
                  .reduce((sum, run) => sum + measure(base, run).width, 0);

              return { kind, own: measure(family, text).width, rest: width(false), digits: width(true) };
            }),
          };
        }),
      );
    },
    { fallbacks: FALLBACKS, references, size: FONT_MEASURE_SIZE },
  );

  await browser.close();

  for (const { family, ascent, descent, texts } of measured) {
    const { locals } = FALLBACKS.find((fallback) => fallback.family === family)!;
    const { rest, digits } = fitSizeAdjust(texts);

    console.log(`/* ${family}: ${texts.map(({ kind }) => kind).join(', ')} */`);
    console.log(`@font-face {\n${fontFace(family, locals, ascent, descent, rest).join('\n')}\n}\n`);
    console.log(
      `@font-face {\n${[...fontFace(family, locals, ascent, descent, digits), `  unicode-range: ${DIGITS_RANGE};`].join('\n')}\n}\n`,
    );

    for (const text of texts) {
      const ratio = (rest * text.rest + digits * text.digits) / text.own;

      console.error(`${family} · ${text.kind}: ширина ${ratio.toFixed(4)}`);
    }
  }
};

await main();
