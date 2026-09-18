import { defineConfig, devices } from '@playwright/test';

/**
 * Carrega variáveis de ambiente customizadas de .env.e2e se existir.
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Guardrail de Produção em tempo de configuração
try {
  const url = new URL(baseURL);
  const isProduction =
    url.hostname === 'afmotos.vercel.app' ||
    url.hostname === 'afmotos.com.br' ||
    url.hostname.endsWith('.afmotos.com.br');

  if (isProduction && process.env.E2E_ALLOW_DESTRUCTIVE === 'true') {
    throw new Error(
      'CRITICAL SAFETY VIOLATION: E2E_ALLOW_DESTRUCTIVE is strictly prohibited when targeting production environments!'
    );
  }
} catch (e: unknown) {
  if (e instanceof Error && e.message.includes('CRITICAL SAFETY VIOLATION')) {
    throw e;
  }
  // Se baseURL for relativa ou em formato diferente em desenvolvimento, continue normalmente
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  projects: [
    {
      name: 'smoke',
      testMatch: /.*\/smoke\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testIgnore: /.*\/smoke\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: /.*\/responsive-.*\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
  ],
});
