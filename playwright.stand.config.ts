import { defineConfig, devices } from '@playwright/test';
import { STAND_URL } from './tests/stand/consts';

/** Проверка живого стенда: сервер не поднимается, тесты идут по адресу стенда (`yarn test:stand`). */
export default defineConfig({
  testDir: './tests/stand',
  reporter: [['list']],
  use: {
    baseURL: STAND_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
