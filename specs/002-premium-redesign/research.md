# Research & Design Decisions: AF Motos Premium Redesign

**Feature**: AF Motos – Premium Visual Redesign (`002-premium-redesign`)  
**Date**: 2026-08-21  
**Status**: Completed  

---

## 1. Design System & Theme Architecture (Tailwind CSS v4)

### Decision
Utilize Tailwind CSS v4 CSS-first `@theme` configuration and CSS custom properties in `app/globals.css` with the specified automotive premium palette:
- **Graphite Background / Accent Dark**: `#0B0D0F`
- **Surface Dark**: `#171A1D`
- **Light Neutral / Background Light**: `#F5F5F2`
- **White Pure**: `#FFFFFF`
- **Action / Commercial Primary**: `#D94832` (Racing Red / Terracotta Automotive Accent)
- **Action Hover**: `#C0392B` / `#B83A26`
- **Secondary Text / Muted**: `#8A9096` / `#A8ADB2`
- **Subtle Borders**: `#E4E6E8` (light mode) / `rgba(255, 255, 255, 0.10)` (dark mode)

### Rationale
- Tailwind v4 eliminates JavaScript-based `tailwind.config.js` in favor of high-performance CSS variables and native `@theme` declarations.
- Defining semantic tokens (`--background`, `--foreground`, `--primary`, `--muted`, `--card`, `--border`, `--radius`) ensures that all components remain strictly consistent without arbitrary hardcoded hex codes across JSX files.
- The high-contrast dark graphite and warm neutral palette evokes an upscale showroom atmosphere rather than a generic tech template.

### Alternatives Considered
- *Full Dark Mode default*: Rejected because automotive dealerships benefit from bright, crisp product presentation on white/neutral cards while utilizing rich dark graphite for hero/header/footer contrast.
- *Heavy Glassmorphism & Neon gradients*: Explicitly avoided to maintain an authentic, reliable dealership aesthetic with high legibility.

---

## 2. Typography & Hierarchy Scale

### Decision
Implement a modern, robust sans-serif typographic scale with tabular numbers for currency and technical metrics:
- **Display**: `text-4xl md:text-6xl font-black tracking-tight leading-none`
- **H1 (Page Title)**: `text-3xl md:text-4xl font-extrabold tracking-tight`
- **H2 (Section Header)**: `text-2xl md:text-3xl font-bold tracking-tight`
- **H3 (Card / Item Title)**: `text-lg md:text-xl font-bold leading-snug`
- **Body Regular**: `text-sm md:text-base text-muted-foreground leading-relaxed`
- **Price Large**: `text-2xl md:text-3xl font-black tracking-tight text-foreground`
- **Price Card**: `text-xl md:text-2xl font-black tracking-tight text-primary`
- **Metadata / Specs**: `text-xs font-semibold text-muted-foreground tracking-normal`
- **Badge / Label**: `text-[11px] font-bold uppercase tracking-wider`

### Rationale
- Clear differentiation between hierarchy levels prevents visual fatigue.
- Automotive specs (cc, km, year) need rapid scanning without visual noise.

---

## 3. Component Hierarchy & UX Patterns

### Decision
1. **Header & Navigation**:
   - Sticky header with slim height (`h-16 md:h-20`), clean typography, dealership branding, desktop nav links, WhatsApp direct action button, and a responsive mobile sheet menu.
2. **Hero Section**:
   - Editorial high-impact layout: Strong value proposition ("Sua próxima conquista sobre duas rodas"), dual conversion CTAs ("Ver estoque", "Venda ou consigne"), badge de procedência, e background visual refinado.
3. **Quick Search & Filter Bar**:
   - Integrated horizontal search bar on homepage (Brand, Category, Max Price, Year) driving users directly to filtered catalog views.
4. **Motorcycle Card Architecture**:
   - Fixed aspect ratio (`aspect-[16/10]` or `aspect-[4/3]`) with subtle hover zoom (`group-hover:scale-105 transition-transform duration-500`).
   - Floating status badges (Disponível, Reservada, Vendida) and origin tag (Único Dono, IPVA Pago, etc.).
   - Clean specs bar (Ano, KM, Cilindrada) with icons/dividers.
   - Price display with strikethrough for promo pricing and primary CTA button.
5. **Catalog & Filters**:
   - Sticky desktop filter sidebar and mobile filter drawer with instant count and clear filters button.
6. **Motorcycle Detail Page**:
   - Responsive multi-photo gallery with thumbnail strip, full-width specs grid, vehicle differentials badges, financing simulation prompt, and a mobile sticky bottom WhatsApp CTA bar.
7. **Institutional & Services Pages (`/venda-sua-moto`, `/consignar-moto`, `/aluguel`, `/motos-vendidas`)**:
   - Step-by-step numbered process cards, transparency guarantees, FAQ accordion, and validated lead capture forms.

---

## 4. Accessibility & Mobile-First Strategy

### Decision
- All interactive elements adhere to WCAG 2.1 AA contrast standards (minimum 4.5:1 for body text, 3:1 for large headers and interactive icons).
- Form inputs have explicit labels and aria attributes.
- Mobile touch targets are at least 44x44px.
- Bottom CTA sheet on mobile detail page remains unobtrusive with safe area padding (`pb-safe`).
