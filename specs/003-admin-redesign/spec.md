# Admin Panel Redesign

## 1. Overview

The goal is to completely fix and redesign the administrative panel for AF Motos. Currently, the admin panel is visually broken, inconsistent, and inherits the public site's layout (header, footer, WhatsApp button, etc.), creating conflicting navigation and displaced content. The redesign must provide a clean, dedicated administrative layout optimized for productivity, clearly separated from the public site, while maintaining the brand's visual identity (graphite/black base, gold for primary actions, modern typography).

In addition to visual improvements, the admin panel must be fully connected to real data in Supabase with proper Row Level Security (RLS) policies and correct authentication flows.

## 2. User Scenarios & Testing

- **Unauthenticated User:** Tries to access `/admin` or `/admin/login`. At `/admin/login`, they see a dedicated login screen without the public header/footer. They cannot access `/admin` or view/modify any motorcycles.
- **Admin User (Login):** Logs in with valid credentials at `/admin/login`, sees loading state, and is successfully redirected to the `/admin` dashboard.
- **Admin User (Dashboard):** Views real-time metrics (available, reserved, sold, rented motorcycles, and new leads) and recent items, fetched directly from Supabase.
- **Admin User (Manage Motorcycles):** Accesses `/admin/motos` to see a list of all motorcycles. They can filter (status, category, operation), sort, and search. They can create, edit, and hide motorcycles. Changes are persisted in the database.
- **Admin User (Motorcycle Form):** Fills out a new motorcycle form with client-side and server-side validation. Uploads images, sets a main image, and saves. They see clear success/error feedback. Uploaded images are stored in Supabase Storage.
- **Admin User (Security):** Attempts to access internal features; everything works. If a user without admin role logs in, they are blocked from accessing or modifying admin data due to RLS.

## 3. Functional Requirements

### 3.1. Layout Architecture

- Implement isolated layout contexts for Public Site, Admin Login, and Protected Admin areas.
- The Admin Login (`/admin/login`) must show only the authentication UI with brand elements.
- The Protected Admin (`/admin/...`) must include a desktop sidebar, administrative header, breadcrumbs, content area, mobile drawer, user info, and logout button.
- Public components (header, footer, WhatsApp CTA) must NOT render in admin routes.

### 3.2. Authentication & Security

- Implement robust server-side session validation.
- Remove `SECURITY DEFINER` from `public_motorcycles` view if unnecessary, or secure it.
- Explicitly set `search_path` on functions like `is_admin()`.
- Revoke `EXECUTE` on admin functions from `anon` and unnecessarily from `authenticated` roles.
- Ensure proper RLS policies so only admins can modify `motorcycles`, `motorcycle_images`, etc.
- No client-side modification of `profiles.role`.

### 3.3. Dashboard (`/admin`)

- Display real data metrics from Supabase (totals for availability, sales, rentals, leads).
- Include appropriate loading, empty, and error states.
- Display recent motorcycles and proposals.

### 3.4. Motorcycle Management (`/admin/motos`)

- Implement a real data grid/list connected to `public.motorcycles`.
- Support filtering, searching, pagination/efficient loading.
- Enable creation, editing, and status updates using real Supabase enums (`ownership_type`, `operation_type`, `motorcycle_status`).

### 3.5. Motorcycle Form & Image Upload

- Multi-section form: Basic Info, Specs, Commercial, Publishing, Images.
- Real-time client and server validation.
- Secure image upload to Supabase Storage, linking to `motorcycle_images`.
- Support setting main image, ordering, deletion, and preview.

### 3.6. UI/UX and Responsiveness

- Apply the specified color palette (Graphite, Gold, White, Gray).
- Ensure the layout is fully responsive from 320px up to ultrawide displays.
- Comply with basic accessibility standards (labels, focus-visible, contrast, keyboard navigation).

## 4. Success Criteria

- The public layout components (header, footer, etc.) never appear in `/admin` routes.
- The `/admin/login` page displays correctly without sidebar or public elements.
- All dashboard metrics and list views use real data from Supabase, completely replacing mock data.
- Creating, editing, uploading images, and deleting/hiding motorcycles successfully persists in Supabase.
- Unauthenticated or non-admin users cannot access or mutate administrative data (verified by RLS tests).
- The admin interface is fully responsive on mobile devices (320px+) without overlapping elements or horizontal scrolling issues.

## 5. Scope & Assumptions

- **Scope Limits:** Focuses on the admin UI layout, motorcycle management module, and RLS security fixes. Lead/Proposal management (`/admin/propostas`) routing and basic layout will be set up, but deep feature implementation of proposals might be handled separately if it exceeds this spec.
- **Assumptions:** A Supabase Storage bucket (e.g., `motorcycles`) either exists or can be safely created. The project uses Next.js App Router.
