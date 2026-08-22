# Research & Architecture Decisions

## 1. Needs Clarification Resolutions
No items were explicitly marked as "NEEDS CLARIFICATION" in the spec. However, we researched how to handle the `public_motorcycles` view security definer issue.
- **Decision:** We will replace the `SECURITY DEFINER` view with standard RLS policies on the `motorcycles` table, or restrict the `is_admin()` function properly.
- **Rationale:** The current implementation bypasses RLS and exposes potential data if not carefully managed. Setting explicit `search_path` on functions and revoking public execution rights mitigates the issues reported by Supabase.

## 2. Layout Architecture
- **Decision:** Use Next.js Route Groups (`(public)` and `(admin)`) to isolate layout contexts.
- **Rationale:** This is the standard and most robust way in Next.js App Router to apply different layouts (Header/Footer vs Admin Sidebar) to different parts of the application without conditional rendering hacks in a single root layout.

## 3. Storage
- **Decision:** Use Supabase Storage bucket `motorcycle-images` with RLS policies allowing public read but restricted (admin-only) insert/update/delete.
- **Rationale:** Ensures uploaded images are secure and properly linked to motorcycles, replacing the external temporary URLs.
