# Quickstart & Visual Verification Guide: AF Motos Redesign

**Feature**: AF Motos – Premium Visual Redesign (`002-premium-redesign`)  
**Date**: 2026-08-21

---

## 1. Prerequisites & Environment

1. Node.js 20+ and npm installed.
2. Local `.env.local` containing Supabase connection parameters (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

---

## 2. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Visual & Functional Verification Scenarios

### Scenario 1: Homepage & Premium Branding

- **URL**: `http://localhost:3000`
- **Verify**:
  - Hero banner renders with strong typography and high-contrast dual CTAs.
  - Quick Search bar allows filtering by Brand, Model, Max Price, and Year.
  - "Motos em Destaque" displays high-quality motorcycle cards with status badges and formatted pricing.
  - Benefits & Trust pillars (Garantia de Procedência, Laudo Cautelar, etc.) are highlighted.
  - Split service sections for Venda, Consignação, and Aluguel.
  - Mobile responsiveness: Hamburger menu works smoothly with no horizontal scrolling.

### Scenario 2: Catalog & Filter Drawer

- **URL**: `http://localhost:3000/motos`
- **Verify**:
  - Desktop sticky filter sidebar is clean and responsive.
  - Mobile filter drawer opens seamlessly with touch-friendly controls.
  - Clear filters button resets query parameters.
  - Empty state displays a friendly, actionable message if no bikes match.

### Scenario 3: Motorcycle Detail Page

- **URL**: `http://localhost:3000/motos/[any-slug]`
- **Verify**:
  - Image gallery allows thumbnail switching and mobile swipe.
  - Price is prominently displayed with previous price strikethrough if applicable.
  - Technical specs are organized in an easy-to-scan grid.
  - WhatsApp CTA opens a pre-formatted WhatsApp chat with vehicle details.
  - Mobile view displays a fixed bottom CTA bar.

### Scenario 4: Service Pages (Venda / Consignação / Aluguel)

- **URLs**:
  - `http://localhost:3000/venda-sua-moto`
  - `http://localhost:3000/consignar-moto`
  - `http://localhost:3000/aluguel`
  - `http://localhost:3000/motos-vendidas`
- **Verify**:
  - Step-by-step guidance cards explain the respective process.
  - Lead submission forms include clear labels, input masks, and visual validation states.
  - Sold motorcycles showcase portfolio without displaying confidential owner data.

---

## 4. Code Quality & Build Checks

```bash
# Typecheck
npx tsc --noEmit

# Lint
npm run lint

# Production Build
npm run build
```
