# Quickstart Validation Guide

Follow these steps to validate the Admin Panel Redesign end-to-end:

## Prerequisites

1. Ensure the development server is running (`npm run dev`).
2. Ensure you have a valid admin account in your local/remote Supabase instance.
3. Ensure the Supabase Storage bucket `motorcycles` is created and public-read enabled.

## 1. Unauthenticated Routing

1. Open an incognito window and navigate to `http://localhost:3000/admin`.
2. **Expected:** You are redirected to `/admin/login`.
3. Verify that the login page **does not** display the public site's header, footer, or floating WhatsApp button. It should be a standalone, clean login UI.

## 2. Authentication Flow

1. At `/admin/login`, enter invalid credentials.
   - **Expected:** Clear error feedback.
2. Enter valid admin credentials.
   - **Expected:** Successful redirect to the `/admin` dashboard.
3. Check the layout of `/admin`.
   - **Expected:** The public header/footer is absent. You see an administrative sidebar, top header, and main content area.

## 3. Dashboard Data Validation

1. View the metrics on `/admin`.
   - **Expected:** The totals (available, sold, rented, etc.) reflect the actual data in your Supabase database, not mocked static numbers.

## 4. Motorcycle Management

1. Navigate to `/admin/motos`.
   - **Expected:** A real data grid/list of motorcycles from Supabase.
2. Click "Nova Moto". Fill out the multi-step form with valid data. Upload an image.
   - **Expected:** Success notification. The motorcycle appears in the list. The image is uploaded to Supabase Storage.
3. Edit an existing motorcycle. Change its status to `HIDDEN`.
   - **Expected:** The change persists in the database.
4. Open a new non-incognito tab to the public site `http://localhost:3000/`.
   - **Expected:** The hidden motorcycle is **not** visible to public users.

## 5. Security & RLS Validation

1. Log in as a non-admin user (if you have one) and try to access `/admin`.
   - **Expected:** Denied access or redirected away.
2. In the Supabase dashboard, attempt to query the `plate` field as an anonymous user (if testing via API).
   - **Expected:** Access denied to sensitive fields.
