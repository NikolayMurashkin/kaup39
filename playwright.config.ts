import { defineConfig, devices } from '@playwright/test';
import {
  BASE_URL,
  E2E_DATABASE_URL,
  E2E_MEDIA_DIR,
  LEAD_ENV,
  PORT,
  SINK_BASE_URL,
  SINK_HTTP_PORT,
  SINK_SMTP_PORT,
  STAND_BASE_URL,
  STAND_ENV,
  STAND_PORT,
  STATE_SPECS,
} from './tests/e2e/consts';

/** Каналы заявки обоих серверов смотрят в приемник: бот и почта студии в e2e не нужны. */
const SERVER_ENV = { DATABASE_URL: E2E_DATABASE_URL, PAYLOAD_SECRET: 'e2e', MEDIA_DIR: E2E_MEDIA_DIR, ...LEAD_ENV };

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: STATE_SPECS,
    },
    {
      name: 'state',
      use: { ...devices['Desktop Chrome'] },
      testMatch: STATE_SPECS,
      dependencies: ['chromium'],
      // каждая спека меняет главную по-своему: одновременно они видели бы чужую страницу
      workers: 1,
    },
  ],
  // серверы поднимаются по очереди: второй стартует, когда первый готов, то есть сборка уже есть
  webServer: [
    {
      // приемник заявок стартует до приложения: заявка из смоука уходит в него
      command: 'node tests/e2e/lead-sink.ts',
      env: { SINK_HTTP_PORT: String(SINK_HTTP_PORT), SINK_SMTP_PORT: String(SINK_SMTP_PORT) },
      url: `${SINK_BASE_URL}/calls`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      stdout: 'pipe',
    },
    {
      command: `yarn seed:e2e && yarn build && yarn start -p ${PORT}`,
      env: SERVER_ENV,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: 'pipe',
    },
    {
      command: `yarn start -p ${STAND_PORT}`,
      // флаг миграций задан в образе стенда: сервер стартует на базе, которую ведут миграции, как стенд
      env: { ...SERVER_ENV, ...STAND_ENV, MIGRATE_ON_START: 'true' },
      url: STAND_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'pipe',
    },
  ],
});
