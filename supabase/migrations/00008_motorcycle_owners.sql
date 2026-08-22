
CREATE TABLE motorcycle_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  document text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_motorcycle_owners_phone ON motorcycle_owners(phone);
CREATE INDEX idx_motorcycle_owners_email ON motorcycle_owners(email);
