const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const migrations = [
  {
    name: '00001_admin_profiles.sql',
    content: `
CREATE TABLE admin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`
  },
  {
    name: '00002_categories.sql',
    content: `
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
`
  },
  {
    name: '00003_features.sql',
    content: `
CREATE TABLE features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_features_sort_order ON features(sort_order);
`
  },
  {
    name: '00004_motorcycles.sql',
    content: `
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
`
  },
  {
    name: '00005_motorcycle_categories.sql',
    content: `
CREATE TABLE motorcycle_categories (
  motorcycle_id uuid REFERENCES motorcycles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (motorcycle_id, category_id)
);
`
  },
  {
    name: '00006_motorcycle_features_map.sql',
    content: `
CREATE TABLE motorcycle_features_map (
  motorcycle_id uuid REFERENCES motorcycles(id) ON DELETE CASCADE,
  feature_id uuid REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (motorcycle_id, feature_id)
);
`
  },
  {
    name: '00007_motorcycle_images.sql',
    content: `
CREATE TABLE motorcycle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  width integer,
  height integer,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_motorcycle_images_primary ON motorcycle_images(motorcycle_id) WHERE is_primary = true;
CREATE INDEX idx_motorcycle_images_sort_order ON motorcycle_images(motorcycle_id, sort_order);
`
  },
  {
    name: '00008_motorcycle_owners.sql',
    content: `
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
`
  },
  {
    name: '00009_consignments.sql',
    content: `
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
`
  },
  {
    name: '00010_sales.sql',
    content: `
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
`
  },
  {
    name: '00011_leads.sql',
    content: `
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
`
  },
  {
    name: '00012_rentals.sql',
    content: `
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
`
  },
  {
    name: '00013_rental_settings.sql',
    content: `
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
`
  },
  {
    name: '00014_sell_requests.sql',
    content: `
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
`
  },
  {
    name: '00015_analytics_events.sql',
    content: `
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  motorcycle_id uuid REFERENCES motorcycles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  source text,
  metadata jsonb,
  session_id text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_motorcycle ON analytics_events(motorcycle_id);
`
  },
  {
    name: '00016_site_configuration.sql',
    content: `
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
`
  },
  {
    name: '00017_rls_policies.sql',
    content: `
-- Enable RLS for all tables
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_features_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_configuration ENABLE ROW LEVEL SECURITY;

-- Public Read access
CREATE POLICY "Public Read Motorcycles" ON motorcycles FOR SELECT USING (status != 'HIDDEN');
CREATE POLICY "Public Read Images" ON motorcycle_images FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Features" ON features FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Motorcycle_Categories" ON motorcycle_categories FOR SELECT USING (true);
CREATE POLICY "Public Read Motorcycle_Features" ON motorcycle_features_map FOR SELECT USING (true);
CREATE POLICY "Public Read Rental_Settings" ON rental_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Site_Config" ON site_configuration FOR SELECT USING (true);

-- Public Insert Access
CREATE POLICY "Public Insert Leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Sell Requests" ON sell_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Rentals" ON rentals FOR INSERT WITH CHECK (status = 'REQUESTED');
CREATE POLICY "Public Insert Analytics" ON analytics_events FOR INSERT WITH CHECK (true);

-- Admin Access
-- For MVP, assuming any authenticated user is an admin or we check admin_profiles
CREATE POLICY "Admin Full Access admin_profiles" ON admin_profiles USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access categories" ON categories USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access features" ON features USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access motorcycles" ON motorcycles USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access motorcycle_categories" ON motorcycle_categories USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access motorcycle_features_map" ON motorcycle_features_map USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access motorcycle_images" ON motorcycle_images USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access motorcycle_owners" ON motorcycle_owners USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access consignments" ON consignments USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access sales" ON sales USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access leads" ON leads USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access rentals" ON rentals USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access rental_settings" ON rental_settings USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access sell_requests" ON sell_requests USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access analytics_events" ON analytics_events USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access site_configuration" ON site_configuration USING (auth.role() = 'authenticated');
`
  }
];

for (const m of migrations) {
  fs.writeFileSync(path.join(migrationsDir, m.name), m.content);
}
console.log('Migrations generated!');
