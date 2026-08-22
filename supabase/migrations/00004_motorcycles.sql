
CREATE TABLE motorcycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  internal_code text NOT NULL UNIQUE,
  brand text NOT NULL,
  model text NOT NULL,
  version text,
  year_manufacture integer NOT NULL CHECK (year_manufacture >= 1900),
  year_model integer NOT NULL CHECK (year_model >= 1900),
  mileage integer CHECK (mileage >= 0),
  engine_capacity integer CHECK (engine_capacity > 0),
  fuel text CHECK (fuel IN ('gasolina', 'etanol', 'flex', 'eletrico', 'diesel')),
  transmission text CHECK (transmission IN ('manual', 'automatico', 'semiautomatico', 'cvt')),
  color text,
  price numeric(12,2) CHECK (price >= 0),
  description text,
  ownership_type text NOT NULL DEFAULT 'OWNED' CHECK (ownership_type IN ('OWNED', 'CONSIGNMENT')),
  operation_type text NOT NULL DEFAULT 'SALE' CHECK (operation_type IN ('SALE', 'RENTAL', 'SALE_AND_RENTAL')),
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE', 'HIDDEN')),
  featured boolean NOT NULL DEFAULT false,
  license_plate text,
  location text DEFAULT 'São Paulo, SP',
  daily_rate numeric(10,2) CHECK (daily_rate >= 0),
  weekly_rate numeric(10,2) CHECK (weekly_rate >= 0),
  monthly_rate numeric(10,2) CHECK (monthly_rate >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_motorcycles_status ON motorcycles(status);
CREATE INDEX idx_motorcycles_brand ON motorcycles(brand);
CREATE INDEX idx_motorcycles_operation_type ON motorcycles(operation_type);
CREATE INDEX idx_motorcycles_featured ON motorcycles(featured);
CREATE INDEX idx_motorcycles_created_at ON motorcycles(created_at DESC);
