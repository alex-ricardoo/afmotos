
CREATE TABLE rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid NOT NULL REFERENCES motorcycles(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  daily_rate numeric(10,2) NOT NULL CHECK (daily_rate > 0),
  total_amount numeric(12,2),
  deposit_amount numeric(10,2),
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rental_end_date_after_start_date CHECK (end_date > start_date)
);
CREATE INDEX idx_rentals_motorcycle ON rentals(motorcycle_id);
CREATE INDEX idx_rentals_status ON rentals(status);
