import type { Payload } from 'payload';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi, type MockInstance } from 'vitest';
import { migrations } from '@/migrations';

/**
 * Новый стенд: пустая база, ни одного запроса к приложению. Подъем при старте процесса сам применяет все миграции
 * из образа — страницы и админка не ждут, пока кто-то их откроет. Окружение как на сервере: `MIGRATE_ON_START=true`
 * и `NODE_ENV=production` (адаптер Postgres гоняет миграции при старте только при нем и не накатывает схему сам).
 * Модули приложения грузятся после смены окружения: конфиг читает флаг миграций при загрузке.
 */

process.env.MIGRATE_ON_START = 'true';
(process.env as Record<string, string>).NODE_ENV = 'production';
process.env.NEXT_RUNTIME = 'nodejs';
delete process.env.NEXT_PHASE;

/** Таблица, которую создает последняя миграция: есть она — схема создана миграциями, а не только журнал. */
const LAST_MIGRATION_TABLE = 'map_points';

type PayloadCache = Map<string, { payload: Payload | null }>;

let client: Client;
let exit: MockInstance<typeof process.exit>;

const resetSchema = () => client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

const tableExists = async (table: string) => {
  const { rows } = await client.query<{ exists: boolean }>(`SELECT to_regclass($1) IS NOT NULL AS exists`, [
    `public.${table}`,
  ]);

  return rows[0].exists;
};

/** Имена из журнала миграций; журнала нет — миграции не шли вовсе. */
const appliedMigrations = async () => {
  if (!(await tableExists('payload_migrations'))) {
    return [];
  }

  return (await client.query<{ name: string }>('SELECT name FROM payload_migrations')).rows.map(({ name }) => name);
};

/** Экземпляр, который поднял подъем при старте, — из кеша getPayload, без нового подъема. */
const startedPayload = () =>
  (globalThis as unknown as { _payload?: PayloadCache })._payload?.get('default')?.payload ?? null;

beforeAll(async () => {
  const url = process.env.DATABASE_URL ?? '';

  if (!new URL(url).pathname.endsWith('_test')) {
    throw new Error(`тест стирает базу, а ${url} не похожа на тестовую (имя должно кончаться на _test)`);
  }

  client = new Client({ connectionString: url });
  await client.connect();
  await resetSchema();

  exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
});

/** Схема стирается и после: иначе следующий файл получит строки журнала миграций, и push спросит в терминале. */
afterAll(async () => {
  await startedPayload()?.destroy();
  await resetSchema();
  await client.end();
  exit.mockRestore();
});

describe('подъем Payload при старте на пустой базе', () => {
  it('M1: register() без единого запроса — все миграции в журнале, схема создана миграциями', async () => {
    const { register } = await import('@/instrumentation');

    await register();

    expect(await appliedMigrations(), 'payload_migrations после подъема').toEqual(
      expect.arrayContaining(migrations.map(({ name }) => name)),
    );
    expect(await tableExists(LAST_MIGRATION_TABLE), `таблица ${LAST_MIGRATION_TABLE} после подъема`).toBe(true);
  }, 120_000);

  it('M2: подъем прошел без выхода процесса', () => {
    expect(exit, `process.exit: ${JSON.stringify(exit.mock.calls)}`).not.toHaveBeenCalled();
  });
});
