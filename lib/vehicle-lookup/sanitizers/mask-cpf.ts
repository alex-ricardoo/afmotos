/**
 * Masks CPF according to LGPD rules: ***.123.456-**
 */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return '***.***.***-**';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
}
