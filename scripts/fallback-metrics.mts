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
 * У каждой гарнитуры начертание для всех знаков и отдельное для цифр (`unicode-range: U+30-39`) — цифры запасного
 * шрифта отличаются от цифр гарнитур сильнее, чем буквы, и одним `size-adjust` даты и цены не сходились
 * с текстом. Отдельные знаки из `GLYPH_FACES` (пробел и крайние строчные у Ponomar, длинное тире у Golos Text)
 * получают свое начертание с точным `size-adjust` по ширине самого знака. Пара `size-adjust` букв и цифр
 * выбирается так, чтобы худшее отклонение по всем эталонным текстам было наименьшим. Вертикальные метрики
 * берутся из самого шрифта — те же числа, что у next/font, — и пересчитываются на `size-adjust` каждого
 * начертания, чтобы высота строки у всех была одна.
 *
 * Строки расписания со страниц из `--page` меряются еще и в DOM, со стилем своего узла: время набрано цифрами
 * одной ширины, а canvas `font-variant-numeric` не знает. В подгонку они входят суммой по гарнитуре — так же их
 * сверяет тест.
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
 * Страницы — главная и расписание с настоящим контентом, `yarn dev` на рабочей базе:
 * --page http://localhost:3000/ --page http://localhost:3000/raspisanie
 */
import { chromium, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FONT_MEASURE_SIZE, ROW_TEXT_STYLE } from '../tests/e2e/consts';
import { LONG_WORD } from '../tests/e2e/seed/data';
import {
  collectRowTexts,
  collectTexts,
  DIGITS_RANGE,
  GLYPH_FACES,
  measureStyledTexts,
  referenceTexts,
  ROW_PARTS_SELECTOR,
  SYSTEM_GLYPHS,
  YEAR_DATES,
  type ArtboardText,
  type ReferenceText,
  type StyledText,
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
  /** Ширина запасным шрифтом без `size-adjust` по начертаниям: `rest`, `digits` и отдельные знаки. */
  faces: Record<string, number>;
  /**
   * Разрядка (`letter-spacing`, `word-spacing`): браузер добавляет ее к каждому знаку поверх ширины, и от
   * `size-adjust` она не зависит — у настоящего шрифта и запасного она одна.
   */
  spacing: number;
};

type Measured = {
  family: string;
  ascent: number;
  descent: number;
  /** Точный `size-adjust` каждого отдельного знака: ширина знака гарнитуры к ширине знака запасного шрифта. */
  glyphs: Record<string, number>;
  texts: TextWidths[];
};

type Run = { face: string; text: string };

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

const REST = 'rest';

const DIGITS = 'digits';

/** Служебные части артборда: таблица токенов и панель переключателей — не текст страниц. */
const SERVICE_PARTS = '.tokens, .controls';

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

/** Текст только тех гарнитур, у которых есть запасное начертание, — у каждой, даже пустой. */
const pick = (texts: Record<string, string[]>) =>
  Object.fromEntries(FALLBACKS.map(({ family }) => [family, (texts[family] ?? []).join('')]));

/**
 * tsx собирает скрипт esbuild с `keepNames` и оборачивает функции в `__name(...)` — и те, что уходят
 * в `page.evaluate`. В браузере такой функции нет, поэтому страница получает свою, ничего не делающую.
 */
const allowKeptNames = (page: Page) => page.evaluate('globalThis.__name = (target) => target');

const glyphsOf = (family: string) => (GLYPH_FACES[family] ?? []).map(({ chars }) => chars);

/** Куски текста по начертаниям запасного шрифта: отдельные знаки, цифры и все остальное. */
const runsOf = (text: string, glyphs: string[]) =>
  [...text].reduce<Run[]>((runs, char) => {
    const face = glyphs.find((chars) => chars.includes(char)) ?? (/[0-9]/.test(char) ? DIGITS : REST);
    const last = runs.at(-1);

    if (last?.face === face) last.text += char;
    else runs.push({ face, text: char });

    return runs;
  }, []);

/** Ширина текста запасным шрифтом: каждое начертание со своим `size-adjust`. */
const fallbackWidth = ({ faces, spacing }: TextWidths, sizeAdjust: Record<string, number>) =>
  Object.entries(faces).reduce((sum, [face, width]) => sum + sizeAdjust[face] * width, spacing);

/** Худшее отклонение ширины запасного начертания от настоящего по всем текстам. */
const worstDeviation = (texts: TextWidths[], sizeAdjust: Record<string, number>) =>
  Math.max(...texts.map((text) => Math.abs(fallbackWidth(text, sizeAdjust) / text.own - 1)));

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

/**
 * Пара `size-adjust` (все, кроме цифр, и цифры) с наименьшим худшим отклонением при известных `size-adjust`
 * отдельных знаков: отклонение выпукло по обеим.
 */
const fitSizeAdjust = (texts: TextWidths[], glyphs: Record<string, number>): Record<string, number> => {
  const score = (rest: number, digits: number) => worstDeviation(texts, { ...glyphs, [REST]: rest, [DIGITS]: digits });
  const restFor = (digits: number) => argmin((rest) => score(rest, digits));
  const digits = argmin((value) => score(restFor(value), value));

  return { ...glyphs, [REST]: restFor(digits), [DIGITS]: digits };
};

const fontFace = (family: string, locals: string[], ascent: number, descent: number, sizeAdjust: number) => [
  `  font-family: '${family} Metric Fallback';`,
  `  src: ${locals.map((name) => `local('${name}')`).join(', ')};`,
  `  ascent-override: ${percent(ascent / sizeAdjust)};`,
  `  descent-override: ${percent(descent / sizeAdjust)};`,
  '  line-gap-override: 0%;',
  `  size-adjust: ${percent(sizeAdjust)};`,
];

const baseOf = (family: string) => FALLBACKS.find((fallback) => fallback.family === family)!.base;

/**
 * Ширины текстов в DOM со стилем их узла, суммой по гарнитуре: настоящим шрифтом — целиком, запасным — по кускам
 * начертаний и без разрядки. Разрядку браузер добавляет к каждому знаку поверх ширины, от `size-adjust` она
 * не зависит — у настоящего шрифта и запасного она одна и идет отдельным слагаемым.
 */
const domWidths = async (page: Page, kind: string, texts: StyledText[]) => {
  if (!texts.length) return [];

  const plain = texts.map((item) => ({
    ...item,
    style: { ...item.style, 'letter-spacing': '0px', 'word-spacing': '0px' },
  }));
  const own = await page.evaluate(measureStyledTexts, { texts, size: FONT_MEASURE_SIZE });
  const ownPlain = await page.evaluate(measureStyledTexts, { texts: plain, size: FONT_MEASURE_SIZE });
  const runs = plain.flatMap((item, index) =>
    runsOf(item.text, glyphsOf(item.family)).map(({ face, text }) => ({
      index,
      face,
      item: { ...item, text, family: baseOf(item.family) },
    })),
  );
  const runWidths = await page.evaluate(measureStyledTexts, {
    texts: runs.map(({ item }) => item),
    size: FONT_MEASURE_SIZE,
  });

  return FALLBACKS.flatMap(({ family }) => {
    const indexes = texts.flatMap((item, index) => (item.family === family ? [index] : []));

    if (!indexes.length) return [];

    const faces: Record<string, number> = {};

    runs.forEach(({ index, face }, run) => {
      if (texts[index].family === family) faces[face] = (faces[face] ?? 0) + runWidths[run].width;
    });

    return [
      {
        family,
        texts: {
          kind,
          own: indexes.reduce((sum, index) => sum + own[index].width, 0),
          faces,
          spacing: indexes.reduce((sum, index) => sum + own[index].width - ownPlain[index].width, 0),
        },
      },
    ];
  });
};

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

  const rowSums: Record<string, TextWidths[]> = Object.fromEntries(FALLBACKS.map(({ family }) => [family, []]));

  for (const url of pages) {
    await board.goto(url);
    await allowKeptNames(board);
    await board.evaluate(() => document.fonts.ready);

    const texts = pick(await board.evaluate(collectTexts, { skip: null, onPage: true, stress: LONG_WORD }));

    for (const { family } of FALLBACKS) {
      if (texts[family].trim()) references[family].push({ kind: url, text: texts[family] });
    }

    const { texts: rows, date } = await board.evaluate(collectRowTexts, {
      parts: ROW_PARTS_SELECTOR,
      props: ROW_TEXT_STYLE,
      stress: LONG_WORD,
    });
    const groups = [
      {
        kind: `${url}, строки в DOM`,
        texts: rows
          .map((row) => ({ ...row, text: row.text.replace(SYSTEM_GLYPHS, '') }))
          .filter(({ text }) => text.trim()),
      },
      { kind: `${url}, даты года в стиле строки`, texts: date ? YEAR_DATES.map((text) => ({ ...date, text })) : [] },
    ];

    for (const { kind, texts: styled } of groups) {
      for (const widths of await domWidths(board, kind, styled)) rowSums[widths.family].push(widths.texts);
    }
  }

  const page = await browser.newPage();
  const faces = FALLBACKS.map(
    ({ family, file }) =>
      `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${readFileSync(join(FONTS_DIR, file)).toString('base64')})}`,
  );

  await page.setContent(`<style>${faces.join('')}</style>`);
  await allowKeptNames(page);

  const split = FALLBACKS.map(({ family, base }) => ({
    family,
    base,
    glyphs: glyphsOf(family),
    texts: references[family].map(({ kind, text }) => ({ kind, text, runs: runsOf(text, glyphsOf(family)) })),
  }));

  const measured: Measured[] = await page.evaluate(
    async ({ fallbacks, size }) => {
      const context = document.createElement('canvas').getContext('2d')!;

      const measure = (family: string, text: string) => {
        context.font = `${size}px '${family}'`;

        return context.measureText(text);
      };

      return Promise.all(
        fallbacks.map(async ({ family, base, glyphs, texts }) => {
          await document.fonts.load(`${size}px '${family}'`, [...glyphs, ...texts.map(({ text }) => text)].join(''));

          const { fontBoundingBoxAscent, fontBoundingBoxDescent } = measure(family, texts[0].text);

          return {
            family,
            ascent: fontBoundingBoxAscent / size,
            descent: fontBoundingBoxDescent / size,
            glyphs: Object.fromEntries(
              glyphs.map((chars) => [chars, measure(family, chars[0]).width / measure(base, chars[0]).width]),
            ),
            texts: texts.map(({ kind, text, runs }) => {
              const faces: Record<string, number> = {};

              for (const run of runs) faces[run.face] = (faces[run.face] ?? 0) + measure(base, run.text).width;

              return { kind, own: measure(family, text).width, faces, spacing: 0 };
            }),
          };
        }),
      );
    },
    { fallbacks: split, size: FONT_MEASURE_SIZE },
  );

  await browser.close();

  for (const { family, ascent, descent, glyphs, texts: canvasTexts } of measured) {
    const { locals } = FALLBACKS.find((fallback) => fallback.family === family)!;
    const texts = [...canvasTexts, ...rowSums[family]];
    const sizeAdjust = fitSizeAdjust(texts, glyphs);
    const face = (value: number, range?: string) =>
      `@font-face {\n${[...fontFace(family, locals, ascent, descent, value), ...(range ? [`  unicode-range: ${range};`] : [])].join('\n')}\n}\n`;

    console.log(`/* ${family}: ${texts.map(({ kind }) => kind).join(', ')} */`);
    console.log(face(sizeAdjust[REST]));
    console.log(face(sizeAdjust[DIGITS], DIGITS_RANGE));

    for (const { chars, range } of GLYPH_FACES[family] ?? []) console.log(face(sizeAdjust[chars], range));

    for (const text of texts) {
      console.error(`${family} · ${text.kind}: ширина ${(fallbackWidth(text, sizeAdjust) / text.own).toFixed(4)}`);
    }
  }
};

await main();
