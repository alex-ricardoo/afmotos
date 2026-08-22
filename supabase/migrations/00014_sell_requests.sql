
CREATE TABLE sell_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  license_plate text,
  motorcycle_data jsonb,
  brand text,
  model text,
  year_manufacture integer,
  year_model integer,
  color text,
  mileage integer,
  desired_price numeric(12,2),
  photos text[],
  notes text,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'PURCHASED', 'CLOSED')),
  offered_amount numeric(12,2),
  accepted_amount numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sell_requests_status ON sell_requests(status);
