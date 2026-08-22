/**
 * AF Motos - Commission Domain Logic
 * 
 * Defines the business rules for calculating commissions
 * on consigned and sold motorcycles.
 */

export interface CommissionConfig {
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // e.g. 5 for 5% or 1000 for R$ 1000,00
}

export function calculateCommission(salePrice: number, config: CommissionConfig): number {
  if (!salePrice || salePrice <= 0) return 0;
  
  if (config.type === 'FIXED') {
    return config.value;
  }
  
  if (config.type === 'PERCENTAGE') {
    return (salePrice * config.value) / 100;
  }
  
  return 0;
}

export function getNetOwnerValue(salePrice: number, config: CommissionConfig): number {
  const commission = calculateCommission(salePrice, config);
  return salePrice - commission;
}

export function suggestCommissionConfig(askingPrice: number): CommissionConfig {
  // Default business logic: 
  // If price > 20000, 5% commission
  // If price <= 20000, fixed R$ 1000 commission
  
  if (askingPrice > 20000) {
    return { type: 'PERCENTAGE', value: 5 };
  } else {
    return { type: 'FIXED', value: 1000 };
  }
}
