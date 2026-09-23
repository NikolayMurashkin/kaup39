import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { FONTS_DIR } from '../lib/files';

const SCRIPT = fileURLToPath(new URL('../../scripts/subset-fonts.mts', import.meta.url));

/**
 * Три гарнитуры артборда и лицензия OFL рядом с каждой. Список записан явно: пропавший файл
 * должен ронять тест, а не молча сокращать сверку.
 */
const FONT_FILES = [
  'forum-OFL.txt',
  'forum.woff2',
  'golos-text-OFL.txt',
  'golos-text.woff2',
  'ponomar-OFL.txt',
  'ponomar.woff2',
];

/** Скрипт на холодном кеше качает исходники с GitHub, поэтому таймаут с запасом. */
const RUN_TIMEOUT = 180_000;

const filesOf = (dir: string) => (existsSync(dir) ? readdirSync(dir).sort() : []);

const hashes = (dir: string) =>
  Object.fromEntries(
    FONT_FILES.map((file) => [
      file,
      createHash('sha256')
        .update(readFileSync(join(dir, file)))
        .digest('hex'),
    ]),
  );

const runs: string[] = [];

const runScript = () => {
  const output = mkdtempSync(join(tmpdir(), 'kaup39-fonts-'));

  runs.push(output);
  execFileSync(process.execPath, [SCRIPT, output], { stdio: 'pipe' });

  return output;
};

afterAll(() => {
  for (const dir of runs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('сабсеты шрифтов направления', () => {
  it('в репозитории лежат три сабсета и лицензия каждого', () => {
    expect(filesOf(FONTS_DIR)).toEqual(FONT_FILES);
  });

  it(
    'скрипт детерминирован: два запуска подряд дают побайтово те же файлы, что лежат в репозитории',
    () => {
      const committed = hashes(FONTS_DIR);

      for (const output of [runScript(), runScript()]) {
        expect(filesOf(output)).toEqual(FONT_FILES);
        expect(hashes(output)).toEqual(committed);
      }
    },
    RUN_TIMEOUT,
  );
});
