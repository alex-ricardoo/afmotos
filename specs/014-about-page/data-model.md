# Phase 1: Data Model

**Date**: 2026-08-24
**Feature**: About Page

## Entities

### SiteSettings (Existing Extension)

The existing `settings` JSONB field in `public.site_settings` will be extended with an `about` node.

**Path**: `settings.about`

**Fields**:
- `isPublished` (boolean): Determines if the page is visible to the public.
- `heroTitle` (string): Title for the hero section.
- `heroSubtitle` (string): Subtitle for the hero section.
- `description` (string): Main institutional text.
- `additionalText` (string, optional): Extra text.
- `storeImage` (StoreImage object): Details of the store's photo.
- `differentials` (Array of StoreDifferential): List of differentials.
- `location` (Location object): Map and coordinates data.
- `seo` (SeoConfig object): Metadata overrides.

### StoreImage

- `provider` (string): e.g., 'supabase'
- `url` (string): Public URL of the image
- `path` (string): Storage path
- `alt` (string): Alt text for accessibility
- `isActive` (boolean): Whether to display the image

### StoreDifferential

- `id` (string): UUID or generated ID
- `title` (string): e.g., "Atendimento próximo"
- `description` (string, optional): Short text
- `icon` (string): Icon identifier from the configured icon library (e.g., Lucide)
- `isActive` (boolean): Whether to display it
- `sortOrder` (number): Order for UI rendering

### Location

- `mapsUrl` (string, optional): Custom Google Maps share URL
- `latitude` (number, optional): For future interactive maps
- `longitude` (number, optional): For future interactive maps
- `instructions` (string, optional): "Como chegar" instructions text

### SeoConfig

- `title` (string, optional): SEO Title override
- `description` (string, optional): Meta description override
- `ogImageUrl` (string, optional): Open Graph image override

## Validation Rules (Zod Schemas)

A Zod schema `aboutSettingsSchema` will be created to validate this structure when saving from the admin panel.

- URLs (mapsUrl, ogImageUrl) must be valid HTTPS URLs or empty/null.
- `sortOrder` must be an integer.
- Missing values will default to null/false rather than breaking the schema.

## State Transitions

- The Admin form will allow toggling `isPublished`. If false, the public `/sobre` route should return a `notFound()` or display a generic "Em breve" page.
- Modifying the `storeImage` will require uploading the new image to the bucket, receiving the URL, and updating the JSONB. If the old image is replaced, it should ideally be deleted from the bucket to save space.
