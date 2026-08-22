# Research Findings

## 1. 404 on `/admin/motos/[id]/editar`

- **Decision**: Update `app/admin/(protected)/motos/[id]/editar/page.tsx` to explicitly `await params` before accessing `params.id`.
- **Rationale**: The project uses Next.js 16.3.2 (React 19). In this version, route `params` and `searchParams` are Promises and must be awaited. Accessing them synchronously throws an error or resolves to undefined, which makes the Supabase query fail, leading to `notFound()`.
- **Alternatives considered**: None, this is a breaking change in Next.js that must be handled.

## 2. Configuration Settings Schema

- **Decision**: Use the existing `public.site_settings` table to store global configurations.
- **Rationale**: The table already exists with columns `id`, `site_name`, `whatsapp_phone`, `contact_email`, `address`, and a `settings` JSONB column. The JSONB column gives us the flexibility to store branding, social links, and operation details without needing to run migrations for new columns.
- **Alternatives considered**: `site_configuration` exists in migration `00016`, but `site_settings` is in `001_initial_schema.sql` and already has RLS policies setup. The prompt explicitly mentions using `site_settings`.

## 3. Configuration UI and Layout

- **Decision**: Create `/admin/(protected)/configuracoes/page.tsx` using the `admin/(protected)` layout to maintain consistency.
- **Rationale**: The `(protected)` route group already wraps its children in an admin layout with a sidebar. This satisfies the requirement for the settings page to use the administrative layout without the public header.
- **Alternatives considered**: Creating a separate layout, but reusing the existing admin layout is DRY and maintains visual consistency.

## 4. Logo Upload

- **Decision**: Utilize Supabase Storage if the `brand` bucket exists, storing the path in the JSONB `settings.logo_path`.
- **Rationale**: The prompt asks to investigate Storage. A migration `00019_storage_bucket.sql` exists, which suggests buckets are configured. We'll use the Supabase JS client to upload and retrieve public URLs.

## 5. RLS and Permissions

- **Decision**: The RLS on `site_settings` is already `Site settings are public (SELECT)` and `Admins have full access (ALL)`. Server Actions will use a Supabase client with the user's session to respect RLS.
- **Rationale**: Adheres to the prompt's security requirements and the project's Constitution.
