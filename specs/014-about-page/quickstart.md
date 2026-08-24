# Quickstart & Validation Guide

**Feature**: About Page

This guide outlines how to validate the feature end-to-end after implementation.

## Prerequisites

- Local development server running (`npm run dev`).
- Access to the admin panel with an administrator account.

## Validation Scenarios

### Scenario 1: Admin Configuration

1. Log in to the admin panel at `http://localhost:3000/admin`.
2. Navigate to the Configuration page.
3. Locate the new "Sobre a Loja" section.
4. Fill in the "Título", "Descrição", and add 2 Differentials.
5. Upload a store photo (requires valid Supabase storage setup).
6. Save the settings.
7. **Expected Outcome**: The settings save successfully without errors. A quick query to Supabase `site_settings` should reveal the new `about` property in the JSONB.

### Scenario 2: Public Page Rendering

1. Navigate to `http://localhost:3000/sobre`.
2. **Expected Outcome**: The page loads instantly. The hero title, description, store photo, and differentials configured in Scenario 1 are visible.
3. The layout should be elegant and adapt gracefully when testing on mobile viewports (e.g., iPhone 12 Pro dimensions in DevTools).

### Scenario 3: Global Navigation

1. Check the main header menu on `http://localhost:3000`.
2. Check the footer at the bottom of the page.
3. **Expected Outcome**: "Sobre nós" appears in both locations. Clicking it navigates to `/sobre`.

### Scenario 4: Optional Fields Fallback

1. Go back to the admin panel and delete the store photo, or set it to inactive. Remove all differentials. Save.
2. Navigate back to `http://localhost:3000/sobre`.
3. **Expected Outcome**: The page still loads without errors. The image section and differentials section simply do not render. The rest of the page remains intact.
