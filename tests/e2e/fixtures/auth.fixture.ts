import { test as base, Page } from '@playwright/test';
import { TEST_USERS } from './test-users';
import { getE2EEnvironmentConfig } from './environment';

export interface AuthFixtures {
  customerPage: Page;
  adminPage: Page;
  loginAsCustomer: (page: Page) => Promise<void>;
  loginAsAdmin: (page: Page) => Promise<void>;
}

export const test = base.extend<AuthFixtures>({
  loginAsCustomer: async ({}, use) => {
    const login = async (page: Page) => {
      await page.goto('/cliente/login');
      await page.fill('input[type="email"]', TEST_USERS.customer.email);
      await page.fill('input[type="password"]', TEST_USERS.customer.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    };
    await use(login);
  },

  loginAsAdmin: async ({}, use) => {
    const login = async (page: Page) => {
      await page.goto('/admin/login');
      await page.fill('input[type="email"]', TEST_USERS.admin.email);
      await page.fill('input[type="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    };
    await use(login);
  },

  customerPage: async ({ page, loginAsCustomer }, use) => {
    const config = getE2EEnvironmentConfig();
    // Se credenciais reais foram fornecidas, executa login
    if (config.testCustomerEmail && config.testCustomerPassword) {
      await loginAsCustomer(page);
    }
    await use(page);
  },

  adminPage: async ({ page, loginAsAdmin }, use) => {
    const config = getE2EEnvironmentConfig();
    if (config.testAdminEmail && config.testAdminPassword) {
      await loginAsAdmin(page);
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
