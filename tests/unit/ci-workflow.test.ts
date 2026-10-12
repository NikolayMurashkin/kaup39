import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type PackageJson = {
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const CI_PATH = new URL('../../.github/workflows/ci.yml', import.meta.url);
const PACKAGE_PATH = new URL('../../package.json', import.meta.url);

const JOB_LINE = /^ {2}([\w-]+):\s*$/;

const ci = readFileSync(CI_PATH, 'utf8');
const pkg = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8')) as PackageJson;

/** Строки секции `jobs:` — парсера YAML среди прямых зависимостей нет, новый ради теста не ставим. */
const jobLines = () => {
  const lines = ci.split('\n');

  return lines.slice(lines.findIndex((line) => /^jobs:\s*$/.test(line)) + 1);
};

const jobNames = () =>
  jobLines()
    .map((line) => JOB_LINE.exec(line)?.[1])
    .filter((name): name is string => name !== undefined);

/** Блок джоба: от его строки до строки следующего джоба или конца файла. */
const jobBlock = (name: string) => {
  const lines = jobLines();
  const start = lines.findIndex((line) => JOB_LINE.exec(line)?.[1] === name);

  if (start === -1) {
    return '';
  }

  const rest = lines.slice(start + 1);
  const next = rest.findIndex((line) => JOB_LINE.test(line));

  return (next === -1 ? rest : rest.slice(0, next)).join('\n');
};

describe('CI на main', () => {
  it('джобов два: проверки и образ после них, Lighthouse среди них нет', () => {
    expect(jobNames()).toEqual(['checks', 'image']);
    expect(jobBlock('image')).toMatch(/^\s+needs: checks\s*$/m);
  });

  it('в файле CI нет упоминаний Lighthouse — ни шага, ни артефакта, ни комментария', () => {
    expect(ci).not.toMatch(/lighthouse/i);
  });
});

describe('package.json', () => {
  it('нет скриптов Lighthouse и подгонки запасных начертаний, нет пакета Lighthouse CI', () => {
    expect(Object.keys(pkg.scripts).filter((name) => /lighthouse|fallback/i.test(name))).toEqual([]);
    expect(Object.keys(pkg.devDependencies ?? {}).filter((name) => /lhci|lighthouse/i.test(name))).toEqual([]);
    expect(Object.keys(pkg.dependencies ?? {}).filter((name) => /lhci|lighthouse/i.test(name))).toEqual([]);
  });

  it('yarn test — те же шаги, что гонит CI: типы, линт, формат, unit, интеграция, e2e', () => {
    expect(pkg.scripts.test).toBe(
      'yarn typecheck && yarn lint && yarn format:check && yarn test:unit && yarn test:integration && yarn test:e2e',
    );
  });
});
