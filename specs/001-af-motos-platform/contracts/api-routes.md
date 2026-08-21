# API Routes (Route Handlers): AF Motos Platform

**Feature**: 001-af-motos-platform | **Date**: 2026-08-21

All routes are under `app/api/` and use Next.js Route Handlers.

---

## POST /api/plate-lookup

Looks up motorcycle data from a license plate number.

**Authentication**: Required (admin only)

**Request**:
```json
{
  "plate": "ABC1D23"
}
```

**Validation**:
- `plate`: Required string. Must match Brazilian plate format (old: `ABC-1234`, new: `ABC1D23`). Normalized to uppercase, dashes removed.

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "plate": "ABC1D23",
    "brand": "Honda",
    "model": "CB 500F",
    "version": "ABS",
    "yearManufacture": 2022,
    "yearModel": 2022,
    "color": "Vermelha",
    "engineCapacity": 471,
    "fuel": "gasolina"
  }
}
```

**Partial data** (200 — some fields missing):
```json
{
  "success": true,
  "data": {
    "plate": "ABC1D23",
    "brand": "Honda",
    "model": "CB 500F",
    "version": null,
    "yearManufacture": 2022,
    "yearModel": 2022,
    "color": null,
    "engineCapacity": null,
    "fuel": null
  }
}
```

**Error responses**:

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_PLATE` | Plate format is invalid |
| 401 | `UNAUTHORIZED` | No valid admin session |
| 404 | `VEHICLE_NOT_FOUND` | No vehicle found for this plate |
| 429 | `RATE_LIMITED` | Too many requests; try again later |
| 502 | `PROVIDER_ERROR` | Plate lookup provider is unavailable or returned error |
| 503 | `PROVIDER_UNAVAILABLE` | Plate lookup provider is not configured |

**Error format**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PLATE",
    "message": "Formato de placa inválido. Use o formato ABC-1234 ou ABC1D23."
  }
}
```

---

## POST /api/analytics

Tracks a user event.

**Authentication**: Not required (public endpoint)

**Request**:
```json
{
  "eventType": "MOTORCYCLE_VIEW",
  "motorcycleId": "uuid-here",
  "source": "instagram",
  "metadata": {
    "utm_source": "instagram",
    "utm_medium": "social",
    "utm_campaign": "promo_agosto"
  },
  "sessionId": "anon-session-id"
}
```

**Validation**:
- `eventType`: Required. One of: `MOTORCYCLE_VIEW`, `WHATSAPP_CLICK`, `SHARE`, `SELL_REQUEST_SUBMITTED`, `CONSIGNMENT_REQUEST_SUBMITTED`, `RENTAL_REQUEST_SUBMITTED`, `SEARCH`, `FILTER_APPLIED`
- `motorcycleId`: Optional UUID
- `source`: Optional string
- `metadata`: Optional JSON object
- `sessionId`: Optional string

**Success Response** (201):
```json
{
  "success": true
}
```

**Error**: 400 for validation errors, 500 for server errors. Fire-and-forget; client should not block on failures.

---

## POST /api/upload

Handles image upload to Supabase Storage.

**Authentication**: Required (admin only)

**Request**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Image file |
| motorcycleId | string | Yes | Target motorcycle UUID |
| sortOrder | number | No | Display order (defaults to max + 1) |
| isPrimary | boolean | No | Whether this is the main photo (default: false) |

**Validation**:
- File type: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 10MB
- Motorcycle must exist and be owned by admin

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "image-uuid",
    "storagePath": "motorcycles/moto-uuid/filename.jpg",
    "publicUrl": "https://supabase-url/storage/v1/object/public/motorcycle-images/motorcycles/moto-uuid/filename.jpg",
    "sortOrder": 3,
    "isPrimary": false
  }
}
```

**Error responses**:

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_FILE_TYPE` | File type not allowed |
| 400 | `FILE_TOO_LARGE` | File exceeds 10MB limit |
| 400 | `MISSING_MOTORCYCLE_ID` | Motorcycle ID not provided |
| 401 | `UNAUTHORIZED` | No valid admin session |
| 404 | `MOTORCYCLE_NOT_FOUND` | Motorcycle does not exist |
| 500 | `UPLOAD_FAILED` | Storage upload failed |
