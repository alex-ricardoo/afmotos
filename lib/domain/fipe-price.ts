export type PriceDifferenceResult = {
  amount: number | null;
  percentage: number | null;
  direction: 'above' | 'below' | 'equal' | 'unknown';
  label: string;
};

/**
 * Calcula a diferença absoluta e percentual entre o preço anunciado de uma motocicleta
 * e o valor de referência FIPE.
 *
 * @param advertisedPrice Preço anunciado no AF Motos (em reais)
 * @param fipePrice Preço de referência da Tabela FIPE (em reais)
 */
export function calculatePriceDifference(
  advertisedPrice: number | null | undefined,
  fipePrice: number | null | undefined,
): PriceDifferenceResult {
  if (
    advertisedPrice === null ||
    advertisedPrice === undefined ||
    fipePrice === null ||
    fipePrice === undefined ||
    fipePrice <= 0
  ) {
    return {
      amount: null,
      percentage: null,
      direction: 'unknown',
      label: 'Sem comparação disponível',
    };
  }

  const diff = advertisedPrice - fipePrice;
  const percentage = (diff / fipePrice) * 100;
  const roundedDiff = Number(diff.toFixed(2));
  const roundedPercentage = Number(percentage.toFixed(2));

  if (Math.abs(roundedDiff) < 0.01) {
    return {
      amount: 0,
      percentage: 0,
      direction: 'equal',
      label: 'Igual ao valor de referência',
    };
  }

  if (roundedDiff > 0) {
    return {
      amount: roundedDiff,
      percentage: roundedPercentage,
      direction: 'above',
      label: `${Math.abs(roundedPercentage).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% acima da FIPE`,
    };
  }

  return {
    amount: roundedDiff,
    percentage: roundedPercentage,
    direction: 'below',
    label: `${Math.abs(roundedPercentage).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% abaixo da FIPE`,
  };
}

/**
 * Formata um valor numérico em reais (BRL).
 */
export function formatFipeCurrency(valueInReais: number | null | undefined): string {
  if (valueInReais === null || valueInReais === undefined || isNaN(valueInReais)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInReais);
}

/**
 * Formata um ano ou indicação de 0km.
 */
export function formatModelYear(modelYear: number | null | undefined, isZeroKm?: boolean): string {
  if (isZeroKm || modelYear === 0 || modelYear === null || modelYear === undefined) {
    return '0km (Novo)';
  }
  return String(modelYear);
}
