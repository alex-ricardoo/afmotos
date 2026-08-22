
CREATE TABLE consignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid NOT NULL REFERENCES motorcycles(id),
  owner_id uuid NOT NULL REFERENCES motorcycle_owners(id),
  asking_price numeric(12,2) NOT NULL,
  minimum_price numeric(12,2),
  advertised_price numeric(12,2),
  commission_type text NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value numeric(10,2) NOT NULL CHECK (commission_value > 0),
  commission_amount numeric(12,2),
  contract_status text NOT NULL DEFAULT 'DRAFT' CHECK (contract_status IN ('DRAFT', 'ACTIVE', 'SOLD', 'EXPIRED', 'CANCELLED', 'RETURNED')),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT end_date_after_start_date CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX idx_consignments_motorcycle ON consignments(motorcycle_id);
CREATE INDEX idx_consignments_owner ON consignments(owner_id);
CREATE INDEX idx_consignments_status ON consignments(contract_status);
