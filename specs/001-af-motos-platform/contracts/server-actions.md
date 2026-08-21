# Server Actions: AF Motos Platform

**Feature**: 001-af-motos-platform | **Date**: 2026-08-21

All Server Actions are defined in `lib/actions/` with `"use server"` directive. Each action validates input with Zod and checks authentication where required.

---

## Motorcycle Actions (`lib/actions/motorcycles.ts`)

### createMotorcycle

Creates a new motorcycle record.

**Auth**: Required (admin)

**Input**:
```typescript
{
  brand: string           // Required
  model: string           // Required
  version?: string
  yearManufacture: number // Required, ≥ 1900
  yearModel: number       // Required, ≥ 1900
  mileage?: number        // ≥ 0
  engineCapacity?: number // > 0
  fuel?: FuelType
  transmission?: TransmissionType
  color?: string
  price?: number          // ≥ 0
  description?: string
  ownershipType: 'OWNED' | 'CONSIGNMENT'
  operationType: 'SALE' | 'RENTAL' | 'SALE_AND_RENTAL'
  status?: MotorcycleStatus  // Defaults to 'AVAILABLE'
  featured?: boolean
  licensePlate?: string
  location?: string
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  categoryIds?: string[]
  featureIds?: string[]
}
```

**Behavior**:
1. Validates input with Zod schema
2. Generates slug from brand + model + yearModel (handles duplicates)
3. Generates internal code (sequential: AF-0001, AF-0002, ...)
4. Inserts motorcycle record
5. Inserts category/feature associations
6. Revalidates `/motos`, `/aluguel`, `/` paths
7. Returns `{ success: true, data: { id, slug } }`

---

### updateMotorcycle

Updates an existing motorcycle.

**Auth**: Required (admin)

**Input**: Same as createMotorcycle + `id: string` (required)

**Behavior**:
1. Validates input
2. Checks motorcycle exists
3. Regenerates slug if brand/model/year changed
4. Updates record
5. Syncs category/feature associations
6. Revalidates affected paths
7. Returns `{ success: true }`

---

### updateMotorcycleStatus

Changes motorcycle status with transition validation.

**Auth**: Required (admin)

**Input**:
```typescript
{
  id: string
  status: MotorcycleStatus
}
```

**Behavior**:
1. Loads current motorcycle
2. Validates transition is allowed (via `lib/domain/motorcycle-status.ts`)
3. If transition to SOLD: creates Sale record (see markAsSold)
4. Updates status
5. Revalidates paths
6. Returns `{ success: true }` or `{ success: false, error: "Transição inválida: RENTED → SOLD" }`

---

### markAsSold

Marks a motorcycle as sold and creates sale record.

**Auth**: Required (admin)

**Input**:
```typescript
{
  motorcycleId: string
  salePrice: number
  saleDate?: string        // ISO date, defaults to today
  buyerName?: string
  buyerPhone?: string
  paymentMethod?: string
  notes?: string
}
```

**Behavior**:
1. Validates motorcycle is in a state that can transition to SOLD
2. Creates Sale record
3. Updates motorcycle status to SOLD
4. If consigned: updates consignment status to SOLD, calculates commission
5. Revalidates paths (including `/motos-vendidas`)

---

### toggleFeatured

Toggles the featured flag on a motorcycle.

**Auth**: Required (admin)

**Input**: `{ id: string }`

---

### duplicateMotorcycle

Creates a copy of an existing motorcycle (without images).

**Auth**: Required (admin)

**Input**: `{ id: string }`

**Behavior**: Copies all fields except id, slug, internal_code, status (set to HIDDEN), featured (false). Generates new slug and code.

---

### deleteMotorcycle

Soft deletes a motorcycle (sets status to HIDDEN or removes if never published).

**Auth**: Required (admin)

**Input**: `{ id: string }`

---

## Image Actions (`lib/actions/images.ts`)

### reorderImages

Updates sort order for a motorcycle's images.

**Auth**: Required (admin)

**Input**:
```typescript
{
  motorcycleId: string
  imageIds: string[]  // Ordered array of image IDs
}
```

---

### setPrimaryImage

Sets a specific image as the primary/main photo.

**Auth**: Required (admin)

**Input**: `{ motorcycleId: string, imageId: string }`

**Behavior**: Sets `is_primary = false` on all other images for this motorcycle, then sets `is_primary = true` on the target image.

---

### deleteImage

Removes an image from storage and database.

**Auth**: Required (admin)

**Input**: `{ imageId: string }`

**Behavior**: Deletes from Supabase Storage, then removes DB record. If deleted image was primary, sets the next image (by sort_order) as primary.

---

## Lead Actions (`lib/actions/leads.ts`)

### createLead

Creates a new lead from any public form.

**Auth**: Not required (public)

**Input**:
```typescript
{
  type: LeadType
  name: string           // Required
  phone: string          // Required, validated as Brazilian phone
  email?: string         // Validated if provided
  motorcycleId?: string
  message?: string
  source?: string
  metadata?: Record<string, unknown>
}
```

**Behavior**:
1. Validates with Zod
2. Sanitizes input
3. Inserts lead with status NEW
4. Returns `{ success: true }`

---

## Sell Request Actions (`lib/actions/sell-requests.ts`)

### submitSellRequest

Submits a proposal to sell a motorcycle to AF Motos.

**Auth**: Not required (public)

**Input**:
```typescript
{
  name: string
  phone: string
  email?: string
  licensePlate?: string
  motorcycleData?: Record<string, unknown>  // Plate lookup result
  brand?: string
  model?: string
  yearManufacture?: number
  yearModel?: number
  color?: string
  mileage?: number
  desiredPrice?: number
  photos?: string[]   // Pre-uploaded storage paths
  notes?: string
}
```

**Behavior**:
1. Validates input
2. Creates lead (type: SELL_MOTORCYCLE)
3. Creates sell_request linked to lead
4. Tracks analytics event (SELL_REQUEST_SUBMITTED)
5. Returns `{ success: true }`

---

## Consignment Actions (`lib/actions/consignments.ts`)

### submitConsignmentRequest

Submits a consignment proposal from public form.

**Auth**: Not required (public)

**Input**: Similar to submitSellRequest with consignment-specific fields.

---

### updateConsignment

Updates consignment contract details (admin).

**Auth**: Required (admin)

**Input**:
```typescript
{
  id: string
  askingPrice?: number
  minimumPrice?: number
  advertisedPrice?: number
  commissionType?: 'percentage' | 'fixed'
  commissionValue?: number
  contractStatus?: ConsignmentStatus
  startDate?: string
  endDate?: string
  notes?: string
}
```

**Behavior**: Validates, recalculates `commission_amount` using domain function, updates record.

---

## Rental Actions (`lib/actions/rentals.ts`)

### submitRentalRequest

Submits a rental request from public form.

**Auth**: Not required (public)

**Input**:
```typescript
{
  motorcycleId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  startDate: string   // ISO date
  endDate: string     // ISO date
}
```

**Behavior**:
1. Validates dates (end > start)
2. Calculates estimated total from motorcycle's daily_rate
3. Creates rental record (status: REQUESTED)
4. Creates lead (type: RENTAL)
5. Tracks analytics event
6. Returns `{ success: true, estimatedTotal: number }`

---

### updateRentalStatus

Updates rental status (admin).

**Auth**: Required (admin)

**Input**: `{ id: string, status: RentalStatus }`

---

## Auth Actions (`lib/actions/auth.ts`)

### signIn

Authenticates admin user.

**Input**: `{ email: string, password: string }`

**Behavior**: Calls `supabase.auth.signInWithPassword()`. Redirects to `/admin` on success.

---

### signOut

Signs out admin user.

**Behavior**: Calls `supabase.auth.signOut()`. Redirects to `/admin/login`.

---

## Settings Actions (`lib/actions/settings.ts`)

### updateSiteConfiguration

Updates global site settings.

**Auth**: Required (admin)

**Input**: Partial `SiteConfiguration` object.

---

## Lead Management Actions

### updateLeadStatus

**Auth**: Required (admin)

**Input**: `{ id: string, status: LeadStatus }`

---

## Standard Action Response Format

All actions return:
```typescript
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }
```

`fieldErrors` is populated when Zod validation fails, mapping field names to error messages for form display.
