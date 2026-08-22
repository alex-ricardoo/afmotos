# Data Model & Security Policies

## 1. Core Entities

### `public.motorcycles`

- Represents the inventory of motorcycles.
- **Fields (Relevant for Admin):**
  - `id` (UUID)
  - `make`, `model`, `version`, `year_manufacture`, `year_model` (Text/Int)
  - `mileage`, `engine_capacity` (Int)
  - `fuel_type`, `transmission`, `color` (Text)
  - `price` (Numeric)
  - `description` (Text)
  - `ownership_type` (Enum: `OWNED`, `CONSIGNMENT`)
  - `operation_type` (Enum: `SALE`, `RENTAL`, `SALE_AND_RENTAL`)
  - `status` (Enum: `AVAILABLE`, `RESERVED`, `SOLD`, `RENTED`, `MAINTENANCE`, `UNAVAILABLE`, `HIDDEN`)
  - `plate` (Text) - Requires strict RLS so it's only visible to admins.
  - `category_id` (UUID, FK to `motorcycle_categories`)
  - `is_featured` (Boolean)

### `public.motorcycle_images`

- Stores image metadata linked to a motorcycle.
- **Fields:**
  - `id` (UUID)
  - `motorcycle_id` (UUID, FK)
  - `storage_path` (Text) - The path in the Supabase Storage bucket.
  - `is_main` (Boolean)
  - `display_order` (Int)

### `public.profiles`

- Stores user data and roles.
- **Fields:**
  - `id` (UUID, FK to auth.users)
  - `role` (Text) - Must be protected from client-side mutation.

## 2. Row Level Security (RLS) Rules

- **Admins (role = 'admin'):**
  - Can `SELECT`, `INSERT`, `UPDATE`, `DELETE` on all tables mentioned above.
- **Public/Anon Users:**
  - Can `SELECT` on `motorcycles` where `status` is not `HIDDEN`. Cannot see the `plate` field (requires column-level security or secure views).
  - Can `SELECT` on `motorcycle_images`.
  - Cannot `INSERT`, `UPDATE`, or `DELETE`.

## 3. Storage Bucket

- **Bucket:** `motorcycles`
- **Policies:**
  - Public Read access for viewing images.
  - Authenticated Admin access for uploading and deleting images.
