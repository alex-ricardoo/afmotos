# Quickstart & Validation Guide

## Setup

Ensure you have the development server running:

```bash
npm run dev
```

Ensure you have a user with `role = 'admin'` in the `profiles` table to access the protected routes.

## Validation Scenarios

### Scenario 1: Edit Motorcycle Route

1. Find a valid UUID in the `motorcycles` table.
2. Navigate to `http://localhost:3000/admin/motos/{UUID}/editar`.
3. The page should load successfully instead of showing a 404.
4. Modify a field (e.g., mileage) and click "Salvar".
5. Verify the success toast appears and the database reflects the updated value.

### Scenario 2: Invalid Motorcycle Route

1. Navigate to `http://localhost:3000/admin/motos/00000000-0000-0000-0000-000000000000/editar`.
2. The page should show a custom "Moto não encontrada" or Next.js standard 404 component, handling the missing data gracefully without throwing an unhandled runtime error.

### Scenario 3: Settings Page Access

1. Navigate to `http://localhost:3000/admin/configuracoes`.
2. The page should load the administrative layout and display the global settings form.
3. Update the WhatsApp number and click "Salvar".
4. Refresh the page to confirm the data persisted.
5. Visit the public homepage (`http://localhost:3000/`) and verify the new WhatsApp number is reflected in the contact buttons/links.

### Scenario 4: Authentication & RLS

1. Open an incognito window.
2. Navigate to `http://localhost:3000/admin/configuracoes`.
3. You should be redirected to the login page.
