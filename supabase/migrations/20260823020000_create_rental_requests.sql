CREATE TABLE rental_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  age integer NOT NULL CHECK (age >= 18),
  has_cnh_a text NOT NULL CHECK (has_cnh_a IN ('Sim', 'Provisória', 'Não')),
  purpose_of_use text NOT NULL,
  motorcycle_id uuid REFERENCES motorcycles(id),
  desired_plan text NOT NULL,
  expected_start_date date NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'APPROVED', 'REJECTED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rental_requests_status ON rental_requests(status);
CREATE INDEX idx_rental_requests_created_at ON rental_requests(created_at DESC);

-- Enable RLS
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (users filling out the form)
CREATE POLICY "Enable insert for anonymous users" ON rental_requests
  FOR INSERT WITH CHECK (true);

-- Only authenticated users (admins) can view, update, delete
CREATE POLICY "Enable read access for authenticated users only" ON rental_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users only" ON rental_requests
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON rental_requests
  FOR DELETE TO authenticated USING (true);
