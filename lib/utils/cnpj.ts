import { cleanNumeric } from './formatters';

export function normalizeCnpj(value: string | null | undefined): string {
  return cleanNumeric(value).slice(0, 14);
}

export function isValidCnpj(value: string | null | undefined): boolean {
  const digits = normalizeCnpj(value || '');
  if (digits.length !== 14 || /^([0-9])\1{13}$/.test(digits)) return false;

  const calculateDigit = (length: number) => {
    let sum = 0;
    let factor = length - 7;
    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * factor;
      factor = factor === 2 ? 9 : factor - 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(12) === Number(digits[12]) && calculateDigit(13) === Number(digits[13]);
}

export function formatCnpj(value: string | null | undefined): string {
  const digits = normalizeCnpj(value);
  if (!isValidCnpj(digits)) return '';
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function maskCnpj(value: string | null | undefined): string {
  const digits = normalizeCnpj(value);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}
