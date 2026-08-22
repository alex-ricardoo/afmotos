# Data Model: Admin Fixes & Site Settings

## `site_settings`

Represents the singleton configuration object for the AF Motos public site.

### Fields

| Name             | Type          | Notes                          |
| :--------------- | :------------ | :----------------------------- |
| `id`             | `uuid`        | Primary Key                    |
| `site_name`      | `text`        | Store Name                     |
| `whatsapp_phone` | `text`        | Primary Contact Number         |
| `contact_email`  | `text`        | Primary Contact Email          |
| `address`        | `text`        | Physical address               |
| `settings`       | `jsonb`       | Flexible configuration payload |
| `created_at`     | `timestamptz` |                                |
| `updated_at`     | `timestamptz` |                                |

### JSONB `settings` Structure

```json
{
  "short_name": "AF Motos",
  "slogan": "Locações e vendas",
  "institutional_description": "A melhor loja de motos...",
  "logo_path": "branding/logo.png",
  "favicon_path": "branding/favicon.png",
  "instagram_url": "https://www.instagram.com/af_motos2026/",
  "facebook_url": "",
  "tiktok_url": "",
  "opening_hours": {
    "monday": "08:00-18:00",
    "tuesday": "08:00-18:00",
    "wednesday": "08:00-18:00",
    "thursday": "08:00-18:00",
    "friday": "08:00-18:00",
    "saturday": "08:00-12:00"
  },
  "brand_colors": {
    "primary": "#050505",
    "accent": "#C9A44C"
  },
  "texts": {
    "home": "Bem vindo a AF Motos",
    "hero": "A sua próxima moto está aqui",
    "support": "Fale com nossa equipe de especialistas",
    "whatsapp_default": "Olá, tenho interesse em uma moto.",
    "service_city": "São Paulo, SP"
  },
  "seo": {
    "title": "AF Motos - Locações e Vendas",
    "description": "A sua próxima moto está aqui",
    "canonical_url": "https://afmotos.com.br",
    "og_image": "branding/og.png"
  }
}
```

## `motorcycles`

Represents a motorcycle in the inventory. We are fixing the edit route, no schema changes.

### State Transitions

- Edits made via the admin panel will perform an `UPDATE` on the `motorcycles` table.
- Site settings edits will perform an `UPDATE` on the `site_settings` table (or an `INSERT` if empty).

## RLS Policies (Existing)

- **site_settings**: `SELECT` is public (`true`). `INSERT`/`UPDATE`/`DELETE` requires `is_admin()`.
- **motorcycles**: Admins can `UPDATE`. Public can `SELECT` visible motorcycles.
