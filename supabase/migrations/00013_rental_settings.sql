
CREATE TABLE rental_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minimum_age integer DEFAULT 21,
  license_categories text[] DEFAULT '{A}',
  required_documents jsonb,
  deposit_info text,
  payment_methods text[],
  rules jsonb,
  included_items jsonb,
  insurance_info text,
  maintenance_policy text,
  assistance_info text,
  general_terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
