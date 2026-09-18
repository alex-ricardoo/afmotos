/**
 * Gerador de identificadores e dados sintéticos para testes E2E
 */

export function generateRunId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 6);

  return `e2e-${year}${month}${day}-${hours}${minutes}-${randomSuffix}`;
}

export const E2E_TEST_PLATES = {
  validMercosul: 'E2E1A23',
  validLegacy: 'E2E2B34',
  anotherValid: 'E2E3C45',
  invalidFormat: 'INVALIDO99',
  tooShort: 'E2E1',
  specialChars: 'E2E@1#3',
};

export interface E2EMotorcycleData {
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
}

export function generateMockMotorcycle(runId: string = generateRunId()): E2EMotorcycleData {
  return {
    title: `E2E_Moto_Teste_${runId}`,
    brand: 'Yamaha',
    model: 'Fazer 250 ABS',
    year: 2024,
    price: 21900,
    mileage: 4500,
    description: `Motocicleta gerada para testes automatizados E2E. RunId: ${runId}`,
  };
}

export interface E2ECustomerData {
  name: string;
  email: string;
  phone: string;
}

export function generateMockCustomer(runId: string = generateRunId()): E2ECustomerData {
  return {
    name: `E2E_Cliente_${runId}`,
    email: `e2e_customer_${runId}@afmotos.test`,
    phone: '(81) 99999-9999',
  };
}
