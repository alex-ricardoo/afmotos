export interface E2EEnvironmentConfig {
  baseUrl: string;
  testCustomerEmail?: string;
  testCustomerPassword?: string;
  testAdminEmail?: string;
  testAdminPassword?: string;
  allowDestructive: boolean;
  runCreditTests: boolean;
  runPaymentSimulation: boolean;
  runAdminMutationTests: boolean;
  runCleanup: boolean;
}

export function getE2EEnvironmentConfig(): E2EEnvironmentConfig {
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const config: E2EEnvironmentConfig = {
    baseUrl,
    testCustomerEmail: process.env.E2E_TEST_CUSTOMER_EMAIL,
    testCustomerPassword: process.env.E2E_TEST_CUSTOMER_PASSWORD,
    testAdminEmail: process.env.E2E_TEST_ADMIN_EMAIL,
    testAdminPassword: process.env.E2E_TEST_ADMIN_PASSWORD,
    allowDestructive: process.env.E2E_ALLOW_DESTRUCTIVE === 'true',
    runCreditTests: process.env.E2E_RUN_CREDIT_TESTS === 'true',
    runPaymentSimulation: process.env.E2E_RUN_PAYMENT_SIMULATION === 'true',
    runAdminMutationTests: process.env.E2E_RUN_ADMIN_MUTATION_TESTS === 'true',
    runCleanup: process.env.E2E_RUN_CLEANUP === 'true',
  };

  validateEnvironmentGuardrails(config);
  return config;
}

export function validateEnvironmentGuardrails(config: E2EEnvironmentConfig): void {
  try {
    const url = new URL(config.baseUrl);
    const hostname = url.hostname.toLowerCase();
    const isProduction =
      hostname === 'afmotos.vercel.app' ||
      hostname === 'afmotos.com.br' ||
      hostname.endsWith('.afmotos.com.br');

    if (isProduction && config.allowDestructive) {
      throw new Error(
        'CRITICAL SAFETY VIOLATION: E2E_ALLOW_DESTRUCTIVE is strictly prohibited when targeting production environments!'
      );
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('CRITICAL SAFETY VIOLATION')) {
      throw err;
    }
    // URLs relativas ou localhost continuam normalmente
  }
}
