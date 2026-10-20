import config from '@payload-config';
import path from 'node:path';
import { fontCharacters, formatReport, restSource, runCheck } from './cms-glyphs.mts';
import { GLYPHS } from './subset-glyphs.mts';

/**
 * Знаки текстов CMS по базе стенда: `yarn check:cms-glyphs`. Читает все тексты через REST админки (вход —
 * `KAUP39_ADMIN_EMAIL` и `KAUP39_ADMIN_PASSWORD`, адрес — `KAUP39_URL`, по умолчанию стенд) и сверяет каждый
 * знак с набором сабсета и файлами шрифтов. Знака нет в `GLYPHS` или в Golos Text — строка со знаком и полем,
 * код выхода 1; нет только в Ponomar или Forum — предупреждение, код не меняет.
 */

const STAND_URL = 'https://kaup39.mrshkn.com';

const FONTS_DIR = path.resolve('src/styles/fonts');

/** Текстовая гарнитура: ей набраны тексты и знак рубля, без знака в ней текст уйдет в запасную. */
const REQUIRED_FONTS = ['golos-text.woff2'];

/** Заголовки и капитель: известные пробелы этих шрифтов — предупреждение, не ошибка. */
const OPTIONAL_FONTS = ['ponomar.woff2', 'forum.woff2'];

const fontFiles = (files: string[]) =>
  Promise.all(files.map(async (file) => ({ file, chars: await fontCharacters(path.join(FONTS_DIR, file)) })));

const main = async () => {
  const url = process.env.KAUP39_URL || STAND_URL;
  const email = process.env.KAUP39_ADMIN_EMAIL;
  const password = process.env.KAUP39_ADMIN_PASSWORD;

  if (!email || !password) throw new Error('не заданы KAUP39_ADMIN_EMAIL и KAUP39_ADMIN_PASSWORD');

  const { texts, report, code } = await runCheck(await restSource(url, email, password), await config, {
    glyphs: GLYPHS,
    required: await fontFiles(REQUIRED_FONTS),
    optional: await fontFiles(OPTIONAL_FONTS),
  });
  const chars = new Set(texts.flatMap(({ text }) => [...text]));

  formatReport(report).forEach((line) => console.log(line));
  console.log(
    `${url}: текстов ${texts.length}, знаков ${chars.size}; находок ${report.findings.length}, предупреждений ${report.warnings.length}`,
  );

  return code;
};

process.exit(
  await main().catch((error: unknown) => {
    console.error(`Проверка знаков не прошла: ${error instanceof Error ? error.message : String(error)}`);

    return 1;
  }),
);
