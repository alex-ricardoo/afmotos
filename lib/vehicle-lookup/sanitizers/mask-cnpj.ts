/**
 * Masks CNPJ according to standard LGPD rules: **.***.XXX/YYYY-**
 * Preserves standard 14-digit visual structure (e.g. **.***.891/0001-** or **.***.300/0001-**)
 */
export function maskCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return '**.***.***/****-**';
  const clean = cnpj.replace(/\D/g, '');
  if (!clean) return '**.***.***/****-**';

  if (clean.length >= 14) {
    const full = clean.slice(-14);
    const middle = full.slice(5, 8);
    const filial = full.slice(8, 12);
    return `**.***.${middle}/${filial}-**`;
  }

  // Handle 11-13 digits inputs gracefully
  const padded = clean.padStart(14, '0');
  const middle = padded.slice(5, 8);
  const filial = padded.slice(8, 12) === '0000' ? '0001' : padded.slice(8, 12);
  return `**.***.${middle}/${filial}-**`;
}
