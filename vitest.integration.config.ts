import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/** База тестов своя, рядом с рабочей в том же контейнере; на CI адрес приходит из сервиса Postgres. */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://kaup39:kaup39@127.0.0.1:5433/kaup39_test';
process.env.PAYLOAD_SECRET ??= 'integration-tests';

export default defineConfig({
  resolve: {
    alias: {
      '@payload-config': fileURLToPath(new URL('./src/payload.config.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/setup.ts'],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
