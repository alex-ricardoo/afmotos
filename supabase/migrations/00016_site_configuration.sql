
CREATE TABLE site_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_phone text NOT NULL,
  site_name text NOT NULL DEFAULT 'AF Motos',
  about_text text,
  address text,
  business_hours jsonb,
  social_links jsonb,
  whatsapp_templates jsonb,
  default_location text DEFAULT 'São Paulo, SP',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
