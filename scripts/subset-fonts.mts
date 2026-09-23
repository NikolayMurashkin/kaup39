#!/usr/bin/env node
/**
 * Сабсеты шрифтов направления «Кауп».
 *
 * Качает исходники трех гарнитур артборда из `google/fonts` по закрепленному коммиту, режет их до
 * набора `GLYPHS` и кладет в `src/styles/fonts` вместе с лицензиями OFL. Вывод детерминированный:
 * повторный запуск дает побайтово те же файлы, это проверяет `tests/unit/font-files.test.ts`.
 * Исходники кешируются в `node_modules/.cache`, чтобы тест не качал их на каждом прогоне.
 *
 * Хинтинг выбрасывается, как это делает сам Google Fonts для всех систем, кроме Windows: у Ponomar
 * и Forum это около трети файла (55 → 38 КБ и 26 → 16 КБ). Из OpenType-фич остаются те, что
 * браузер включает сам, и `tnum` для цифр цен и времени: стилистические наборы Ponomar (`salt`, `ss01`,
 * `ss02`) тянули в сабсет 74 глифа и 16 КБ, а без `font-feature-settings` их никто не увидит.
 * Отрисовка по умолчанию с урезанным набором совпадает с полным попиксельно (проверено 23.09.2026
 * на всех знаках `GLYPHS` в трех кеглях; без `kern` и `liga` кадры расходятся).
 *
 * Запуск: yarn subset:fonts [каталог вывода]
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fontverter from 'fontverter';
import subsetFont from 'subset-font';
import { renameFont } from './sfnt-name.mts';
import { GLYPHS } from './subset-glyphs.mts';

type Font = {
  /** Папка семейства в `google/fonts/ofl`. */
  directory: string;
  source: string;
  /** Имя файлов в репозитории без расширения: `<name>.woff2` и `<name>-OFL.txt`. */
  name: string;
  /** Диапазон осей вариативного шрифта, который остается в сабсете. */
  variationAxes?: Record<string, { min: number; max: number }>;
  /**
   * Новые строки таблицы `name` по `nameId` для шрифта с зарезервированным именем в OFL: сабсет —
   * модифицированная версия, и носить это имя ему нельзя (OFL-FAQ 2.6–2.8). Копирайт и лицензия
   * остаются как есть; имя семейства в CSS задает `src/styles/fonts.ts`, таблица на него не влияет.
   */
  rename?: Record<number, string>;
};

const GOOGLE_FONTS_COMMIT = 'e44c4b011a820c2cbe2fd2cfa8052037d7edb571';

const GOOGLE_FONTS_RAW = `https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_COMMIT}/ofl`;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_OUTPUT = join(ROOT, 'src', 'styles', 'fonts');

const CACHE = join(ROOT, 'node_modules', '.cache', 'kaup39-fonts', GOOGLE_FONTS_COMMIT);

/** Фичи, которые браузер применяет без `font-feature-settings`, плюс `tnum` для `tabular-nums`. */
const KEEP_FEATURES = [
  'calt',
  'ccmp',
  'clig',
  'curs',
  'dist',
  'kern',
  'liga',
  'locl',
  'mark',
  'mkmk',
  'rclt',
  'rlig',
  'rvrn',
  'tnum',
];

/** Начертания, которые берет артборд: Ponomar и Forum — только 400, Golos Text — 400–600. */
const FONTS: Font[] = [
  { directory: 'ponomar', source: 'Ponomar-Regular.ttf', name: 'ponomar' },
  {
    directory: 'forum',
    source: 'Forum-Regular.ttf',
    name: 'forum',
    rename: { 1: 'Kaup Caps', 3: 'KaupCaps-Regular', 4: 'Kaup Caps', 6: 'KaupCaps-Regular' },
  },
  {
    directory: 'golostext',
    source: 'GolosText[wght].ttf',
    name: 'golos-text',
    variationAxes: { wght: { min: 400, max: 600 } },
  },
];

const download = async (path: string) => {
  const cached = join(CACHE, path);
  const hit = await readFile(cached).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });

  if (hit) return hit;

  const response = await fetch(`${GOOGLE_FONTS_RAW}/${path.split('/').map(encodeURIComponent).join('/')}`);

  if (!response.ok) {
    throw new Error(`${path}: ${response.status} ${response.statusText}`);
  }

  const body = Buffer.from(await response.arrayBuffer());

  // через временный файл: оборванная запись не должна остаться в кеше под настоящим именем
  await mkdir(dirname(cached), { recursive: true });
  await writeFile(`${cached}.part`, body);
  await rename(`${cached}.part`, cached);

  return body;
};

const main = async () => {
  const output = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_OUTPUT;

  await mkdir(output, { recursive: true });

  for (const font of FONTS) {
    const source = await download(`${font.directory}/${font.source}`);
    const sfnt = await subsetFont(source, GLYPHS, {
      targetFormat: 'sfnt',
      noHinting: true,
      keepFeatures: KEEP_FEATURES,
      ...(font.variationAxes && { variationAxes: font.variationAxes }),
    });
    const subset = await fontverter.convert(font.rename ? renameFont(sfnt, font.rename) : sfnt, 'woff2');

    await writeFile(join(output, `${font.name}.woff2`), subset);
    await writeFile(join(output, `${font.name}-OFL.txt`), await download(`${font.directory}/OFL.txt`));

    console.log(`${font.name}.woff2: ${source.length} → ${subset.length} байт`);
  }
};

await main();
