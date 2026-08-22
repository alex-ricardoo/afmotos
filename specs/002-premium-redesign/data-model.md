# Data Model & Presentation Schemas: AF Motos Premium Redesign

**Feature**: AF Motos – Premium Visual Redesign (`002-premium-redesign`)  
**Date**: 2026-08-21  
**Status**: Completed  

---

## 1. Domain Entities & Database Mapping (Supabase)

All database entities are preserved and mapped to strongly-typed TypeScript interfaces.

### 1.1 Motorcycle (`motorcycles` table)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID / string | Yes | Unique identifier |
| `slug` | string | Yes | SEO-friendly URL slug (e.g. `honda-cb-500f-2022`) |
| `brand` | string | Yes | Motorcycle brand (e.g. Honda, Yamaha, BMW) |
| `model` | string | Yes | Motorcycle model (e.g. CB 500F, MT-07) |
| `version` | string \| null | No | Model trim or version (e.g. ABS, Special Edition) |
| `year_manufacture` | number | Yes | Manufacturing year |
| `year_model` | number | Yes | Model year |
| `price` | number \| null | No | Selling price in BRL (null = "Consulte") |
| `previous_price` | number \| null | No | Promotional previous price (for strikethrough display) |
| `mileage` | number \| null | No | Mileage in kilometers |
| `engine_capacity` | number \| null | No | Engine displacement in cc |
| `fuel_type` | string \| null | No | Fuel type (Gasolina, Flex, Elétrica) |
| `transmission` | string \| null | No | Transmission type (Manual, Automática) |
| `color` | string \| null | No | Motorcycle color |
| `plate_end` | string \| null | No | Last digit of plate (for rodízio info) |
| `status` | string | Yes | `disponivel` \| `reservada` \| `vendida` \| `alugada` \| `manutencao` \| `indisponivel` |
| `ownership_type` | string | Yes | `propria` \| `consignada` |
| `purpose` | string | Yes | `venda` \| `aluguel` \| `venda_e_aluguel` |
| `is_featured` | boolean | Yes | Whether the motorcycle appears in featured showcases |
| `description` | string \| null | No | Editorial description |
| `differentials` | string[] \| null | No | Feature highlights (e.g. "Único Dono", "Garantia de Fábrica", "Revisada") |
| `created_at` | string | Yes | Creation timestamp |

### 1.2 Motorcycle Image (`motorcycle_images` table)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID / string | Yes | Image identifier |
| `motorcycle_id` | UUID / string | Yes | Foreign key to motorcycle |
| `url` | string | Yes | Public image URL (Supabase Storage / CDN) |
| `display_order` | number | Yes | Sorting sequence index |
| `is_main` | boolean | Yes | Primary thumbnail flag |

---

## 2. Component Presentation Contracts

### 2.1 `MotorcycleCardProps`
```typescript
export interface MotorcycleCardData {
  id: string
  slug: string
  brand: string
  model: string
  version?: string | null
  year_manufacture: number
  year_model: number
  price: number | null
  previous_price?: number | null
  mileage: number | null
  engine_capacity: number | null
  status: string
  image_url?: string
  differentials?: string[] | null
}
```

### 2.2 `QuickSearchFilters`
```typescript
export interface QuickSearchFilterState {
  brand?: string
  model?: string
  minYear?: number
  maxPrice?: number
  category?: string
}
```

### 2.3 `LeadSubmissionData`
```typescript
export interface LeadProposalInput {
  name: string
  whatsapp: string
  email?: string
  plate?: string
  brand?: string
  model?: string
  year?: number
  mileage?: number
  desired_price?: number
  notes?: string
  type: 'venda' | 'consignacao' | 'aluguel' | 'interesse'
}
```
