# Auth API Contract: Customer Area

**Feature**: 025-customer-area-plate-dashboard
**Date**: 2026-09-11

## Overview

Authentication for the customer area uses Supabase Auth (email/password + Google OAuth). This document defines the auth-related routes, Server Actions, and middleware behavior.

---

## Routes

### `GET /cliente/login`
Public page. Customer login form (email/password + Google OAuth button).

**Behavior**: If user is already authenticated, redirect to `/cliente`.

### `GET /cliente/cadastro`
Public page. Customer registration form.

**Behavior**: If user is already authenticated, redirect to `/cliente`.

### `GET /api/auth/callback`
Route Handler for Google OAuth code exchange.

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | YES | OAuth authorization code from Supabase |
| `next` | `string` | NO | Return URL after auth (default: `/cliente`) |

**Response**: Redirect to `next` URL on success, redirect to `/cliente/login?error=auth_failed` on failure.

---

## Server Actions

### `registerCustomer(formData)`
Creates a Supabase Auth user and a `customer_profiles` row.

**Input** (Zod-validated):
```typescript
{
  full_name: string;    // min 2 chars
  email: string;        // valid email
  phone: string;        // Brazilian mobile
  date_of_birth: string; // ISO date
  password: string;     // min 8 chars
}
```

**Flow**:
1. Validate input with Zod schema
2. Call `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
3. If error → return `{ error: string }`
4. Insert into `customer_profiles` with the new user's `id`
5. Return `{ success: true }`

**Errors**:
- `User already registered` → return friendly message suggesting login
- Validation errors → return field-specific messages

---

### `loginCustomer(formData)`
Authenticates with email/password.

**Input**:
```typescript
{
  email: string;
  password: string;
}
```

**Flow**:
1. Call `supabase.auth.signInWithPassword({ email, password })`
2. If error → return `{ error: string }`
3. Return `{ success: true }`

---

### `loginWithGoogle()`
Initiates Google OAuth flow.

**Flow**:
1. Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/api/auth/callback?next=/cliente' } })`
2. Return the OAuth URL for client-side redirect

---

### `logoutCustomer()`
Ends the customer session.

**Flow**:
1. Call `supabase.auth.signOut()`
2. Redirect to `/`

---

## Middleware Behavior

**File**: `lib/supabase/middleware.ts`

**New rules** (added to existing admin protection):
```
IF path starts with '/cliente'
  AND path is NOT '/cliente/login'
  AND path is NOT '/cliente/cadastro'
THEN
  IF user is NOT authenticated
    REDIRECT to '/cliente/login?returnUrl={original_path}'
```

The `returnUrl` query parameter is used by the login page to redirect the user back to their originally requested page after successful authentication.
