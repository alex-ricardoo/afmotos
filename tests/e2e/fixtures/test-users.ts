/**
 * Catálogo tipado de personas e credenciais seguras para testes E2E
 */

export interface TestUserCredentials {
  email: string;
  password: string;
  role: 'customer' | 'admin' | 'anonymous' | 'invalid';
  displayName: string;
}

export const TEST_USERS = {
  customer: {
    email: process.env.E2E_TEST_CUSTOMER_EMAIL || 'e2e_customer@afmotos.test',
    password: process.env.E2E_TEST_CUSTOMER_PASSWORD || 'E2E_SecurePassword123!',
    role: 'customer' as const,
    displayName: 'E2E Cliente Teste',
  },
  admin: {
    email: process.env.E2E_TEST_ADMIN_EMAIL || 'e2e_admin@afmotos.test',
    password: process.env.E2E_TEST_ADMIN_PASSWORD || 'E2E_AdminPassword123!',
    role: 'admin' as const,
    displayName: 'E2E Administrador Teste',
  },
  invalid: {
    email: 'usuario_inexistente_e2e@afmotos.test',
    password: 'SenhaIncorreta999!',
    role: 'invalid' as const,
    displayName: 'Usuário Inválido',
  },
};
