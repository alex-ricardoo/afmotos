# Phase 0: Research

**Date**: 2026-08-24
**Feature**: About Page

## 1. Storage of Institutional Configuration

**Task**: Determine the most efficient and safe way to store the "Sobre a Loja" configurations without breaking existing settings.

**Decision**: Store all About page configurations inside the existing `public.site_settings` table under the JSONB `settings` column, within an `about` property.

**Rationale**: The user specification explicitly asks to reuse this structure to avoid unnecessary new tables. It aligns with Supabase's capabilities of handling JSONB and prevents fragmenting global site settings into multiple tables.

**Alternatives considered**:
- Creating a new `about_page` table (Rejected: Increases complexity, violates the explicit user requirement).

## 2. Server-side Data Fetching Strategy

**Task**: Determine how to securely fetch the configuration for the public `/sobre` page without exposing admin-only data.

**Decision**: Implement a specific server-side data fetcher (`getPublicSiteSettings`) that retrieves the raw JSONB from Supabase and strips out any sensitive keys before returning it to the Server Component.

**Rationale**: Follows the security principles of the constitution. Since `site_settings` might contain internal data, the public loader must act as an explicit allow-list.

**Alternatives considered**:
- Loading directly in the client via Supabase SDK (Rejected: Exposes the full row payload, relies on RLS to filter columns, but RLS on rows doesn't filter JSONB properties).

## 3. Google Maps Integration

**Task**: Decide on the initial implementation of the location map.

**Decision**: Use a simple "Como chegar" button that links to Google Maps using a dynamically generated query URL encoding the address (if no custom Maps URL is provided).

**Rationale**: The user specified that the first version should defer complex interactive maps with API keys. Generating a search URL based on the address is safe, free, and works immediately.

**Alternatives considered**:
- Google Maps Embed iframe API (Rejected: Requires an API key that may not be configured yet).
- Custom Map Marker via Maps JS API (Rejected: Deferred to future evolution per spec).
