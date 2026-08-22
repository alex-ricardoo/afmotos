
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('MOTORCYCLE_INTEREST', 'SELL_MOTORCYCLE', 'CONSIGNMENT', 'RENTAL', 'MOTORCYCLE_REQUEST', 'GENERAL_CONTACT')),
  motorcycle_id uuid REFERENCES motorcycles(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  source text,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'CLOSED')),
  message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_type ON leads(type);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_motorcycle ON leads(motorcycle_id);
