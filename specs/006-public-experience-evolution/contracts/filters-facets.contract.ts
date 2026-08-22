/**
 * Interface Contract: Dynamic Motorcycle Filter Facets
 * File: specs/006-public-experience-evolution/contracts/filters-facets.contract.ts
 */

export interface PriceRangeFacet {
  min: number;
  max: number;
}

export interface PriceTierFacet {
  label: string; // e.g. "Até R$ 25.000"
  value: string; // e.g. "25000"
}

export interface MotorcycleFilterFacets {
  brands: string[];
  models: string[];
  categories: { id: string; name: string; slug: string }[];
  years: number[];
  priceRange: PriceRangeFacet;
  priceTiers: PriceTierFacet[];
  totalAvailable: number;
}

export interface FilterSearchParams {
  brand?: string;
  category?: string;
  search?: string;
  q?: string;
  minYear?: string;
  maxPrice?: string;
  status?: string;
  sort?: 'price_asc' | 'price_desc' | 'year_desc' | 'recent';
}
