# UI & Service Contracts: AF Motos Premium Redesign

**Feature**: AF Motos – Premium Visual Redesign (`002-premium-redesign`)  
**Date**: 2026-08-21  

---

## 1. Public UI Component Contracts

### 1.1 Header Component (`components/layout/header.tsx`)
- **Input Props**: None (Server/Client Hybrid)
- **Output Interaction**:
  - Sticky nav with transparent/solid transition on scroll.
  - Links: `/motos` (Estoque), `/venda-sua-moto` (Venda sua Moto), `/consignar-moto` (Consignação), `/aluguel` (Aluguel), `/motos-vendidas` (Vendidas).
  - WhatsApp primary action button linking with pre-configured message.
  - Mobile Menu Sheet with accessible hamburger trigger and keyboard navigation.

### 1.2 QuickSearch Component (`components/filters/quick-search.tsx`)
- **Input Props**: Available brands, categories, and min/max ranges.
- **Output Interaction**:
  - Direct form submission redirecting to `/motos?brand=...&maxPrice=...&year=...`
  - Compact horizontal bar on desktop; collapsible trigger on mobile.

### 1.3 MotorcycleCard Component (`components/motorcycles/motorcycle-card.tsx`)
- **Input Props**: `motorcycle: MotorcycleCardData`
- **Output Interaction**:
  - Click entire card to navigate to `/motos/${motorcycle.slug}`
  - Secondary direct contact action or WhatsApp trigger without nested `<a>` tag conflicts
  - Visual status pill, image fallback, formatted price and mileage.

### 1.4 MotorcycleSpecs Component (`components/motorcycles/motorcycle-specs.tsx`)
- **Input Props**: `motorcycle: MotorcycleDetailData`
- **Output Display**:
  - 2-4 column responsive grid of key technical specs (Ano de Fabricação, Modelo, Quilometragem, Cilindrada, Combustível, Câmbio, Cor, Placa Final).
  - Differentials badges (e.g. Único dono, Revisado em concessionária, IPVA pago).

---

## 2. Server Action & Query Contracts

### 2.1 Lead Submission Action
- **Contract**: `submitLead(data: LeadProposalInput) => Promise<{ success: boolean; error?: string; leadId?: string }>`
- **Validation**: Strict Zod schema validation for Brazilian phone/WhatsApp formatting and required fields.

### 2.2 Motorcycle Query Contracts
- `getAllMotorcycles(filters: FilterParams) => Promise<Motorcycle[]>`
- `getFeaturedMotorcycles() => Promise<Motorcycle[]>`
- `getMotorcycleBySlug(slug: string) => Promise<MotorcycleWithImages | null>`
- `getSoldMotorcycles() => Promise<Motorcycle[]>`
