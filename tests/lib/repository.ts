import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Файлы, которые попадут в коммит: отслеживаемые и новые, не закрытые `.gitignore`. Удаленные
 * с диска, но еще не снятые с индекса, пропускаются — читать их нечего.
 */
export const repositoryFiles = () =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })
    .split('\0')
    .filter((path) => path && existsSync(join(REPO_ROOT, path)));

/** Двоичный файл узнается по нулевому байту: в тексте его не бывает, в шрифтах и картинках он есть всегда. */
export const readTextFile = (path: string) => {
  const content = readFileSync(join(REPO_ROOT, path));

  return content.includes(0) ? null : content.toString('utf8');
};

/** `git check-ignore` отвечает кодом: 0 — путь закрыт `.gitignore`, 1 — нет, остальное — ошибка git. */
export const isIgnoredByGit = (path: string) => {
  const { status, stderr } = spawnSync('git', ['check-ignore', '-q', path], { cwd: REPO_ROOT, encoding: 'utf8' });

  if (status !== 0 && status !== 1) {
    throw new Error(`git check-ignore ${path}: ${stderr}`);
  }

  return status === 0;
};
