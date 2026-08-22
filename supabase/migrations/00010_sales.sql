
CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid NOT NULL REFERENCES motorcycles(id),
  sale_price numeric(12,2) NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_name text,
  buyer_phone text,
  buyer_email text,
  payment_method text,
  consignment_id uuid REFERENCES consignments(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_motorcycle ON sales(motorcycle_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
