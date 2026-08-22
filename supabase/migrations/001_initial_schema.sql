-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Types / Enums / Constraints
CREATE TYPE ownership_type AS ENUM ('OWNED', 'CONSIGNMENT');
CREATE TYPE operation_type AS ENUM ('SALE', 'RENTAL', 'SALE_AND_RENTAL');
CREATE TYPE motorcycle_status AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE', 'HIDDEN');
CREATE TYPE commission_type AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE rental_status AS ENUM ('REQUESTED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE lead_type AS ENUM ('MOTORCYCLE_INTEREST', 'SELL_MOTORCYCLE', 'CONSIGNMENT', 'RENTAL', 'MOTORCYCLE_REQUEST', 'GENERAL_CONTACT');
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'CLOSED');
CREATE TYPE request_status AS ENUM ('NEW', 'UNDER_REVIEW', 'CONTACTED', 'OFFER_SENT', 'NEGOTIATION', 'APPROVED', 'REJECTED', 'PURCHASED', 'CLOSED');

-- 3. Utility Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 4. Tables

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS motorcycle_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Motorcycles
CREATE TABLE IF NOT EXISTS motorcycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    internal_code TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    version TEXT,
    year_manufacture INTEGER NOT NULL CHECK (year_manufacture > 1900),
    year_model INTEGER NOT NULL CHECK (year_model > 1900),
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    engine_capacity INTEGER NOT NULL,
    fuel TEXT NOT NULL,
    transmission TEXT NOT NULL,
    color TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    description TEXT NOT NULL,
    ownership_type ownership_type NOT NULL,
    operation_type operation_type NOT NULL,
    status motorcycle_status NOT NULL DEFAULT 'AVAILABLE',
    license_plate TEXT,
    category_id UUID NOT NULL REFERENCES motorcycle_categories(id),
    featured BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Images
CREATE TABLE IF NOT EXISTS motorcycle_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    alt_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_motorcycle_images_primary ON motorcycle_images(motorcycle_id) WHERE is_primary = true;

-- Features
CREATE TABLE IF NOT EXISTS motorcycle_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature Assignments
CREATE TABLE IF NOT EXISTS motorcycle_feature_assignments (
    motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES motorcycle_features(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (motorcycle_id, feature_id)
);

-- Owners
CREATE TABLE IF NOT EXISTS motorcycle_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consignments
CREATE TABLE IF NOT EXISTS consignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    motorcycle_id UUID NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES motorcycle_owners(id),
    asking_price DECIMAL(12,2) CHECK (asking_price >= 0),
    minimum_price DECIMAL(12,2) CHECK (minimum_price >= 0),
    advertised_price DECIMAL(12,2) CHECK (advertised_price >= 0),
    commission_type commission_type NOT NULL,
    commission_value DECIMAL(12,2) NOT NULL CHECK (commission_value >= 0),
    commission_amount DECIMAL(12,2) CHECK (commission_amount >= 0),
    contract_status TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE CHECK (end_date >= start_date),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    motorcycle_id UUID NOT NULL UNIQUE REFERENCES motorcycles(id) ON DELETE RESTRICT,
    sale_price DECIMAL(12,2) NOT NULL CHECK (sale_price >= 0),
    sale_date DATE NOT NULL,
    buyer_name TEXT,
    buyer_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rental Settings
CREATE TABLE IF NOT EXISTS rental_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minimum_age INTEGER NOT NULL,
    required_license_category TEXT NOT NULL,
    deposit_required BOOLEAN NOT NULL DEFAULT true,
    default_deposit_amount DECIMAL(12,2),
    requirements TEXT NOT NULL,
    included_items TEXT NOT NULL,
    rules TEXT NOT NULL,
    insurance_information TEXT NOT NULL,
    maintenance_information TEXT NOT NULL,
    assistance_information TEXT NOT NULL,
    payment_information TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rentals
CREATE TABLE IF NOT EXISTS rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    motorcycle_id UUID NOT NULL REFERENCES motorcycles(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL CHECK (end_date > start_date),
    daily_rate DECIMAL(12,2) NOT NULL CHECK (daily_rate >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    deposit_amount DECIMAL(12,2) CHECK (deposit_amount >= 0),
    status rental_status NOT NULL DEFAULT 'REQUESTED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type lead_type NOT NULL,
    motorcycle_id UUID REFERENCES motorcycles(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    source TEXT NOT NULL,
    status lead_status NOT NULL DEFAULT 'NEW',
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sell Requests
CREATE TABLE IF NOT EXISTS sell_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    license_plate TEXT NOT NULL,
    motorcycle_data JSONB NOT NULL,
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    desired_price DECIMAL(12,2) CHECK (desired_price >= 0),
    notes TEXT,
    status request_status NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sell Request Images
CREATE TABLE IF NOT EXISTS sell_request_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sell_request_id UUID NOT NULL REFERENCES sell_requests(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consignment Requests
CREATE TABLE IF NOT EXISTS consignment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    license_plate TEXT NOT NULL,
    motorcycle_data JSONB NOT NULL,
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    desired_price DECIMAL(12,2) CHECK (desired_price >= 0),
    notes TEXT,
    status request_status NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consignment Request Images
CREATE TABLE IF NOT EXISTS consignment_request_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consignment_request_id UUID NOT NULL REFERENCES consignment_requests(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Motorcycle Requests
CREATE TABLE IF NOT EXISTS motorcycle_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    brand TEXT,
    model TEXT,
    minimum_year INTEGER,
    maximum_price DECIMAL(12,2),
    category_id UUID REFERENCES motorcycle_categories(id),
    notes TEXT,
    status request_status NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    motorcycle_id UUID REFERENCES motorcycles(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    source TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name TEXT NOT NULL,
    whatsapp_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    address TEXT,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_motorcycles_slug ON motorcycles(slug);
CREATE INDEX IF NOT EXISTS idx_motorcycles_brand ON motorcycles(brand);
CREATE INDEX IF NOT EXISTS idx_motorcycles_model ON motorcycles(model);
CREATE INDEX IF NOT EXISTS idx_motorcycles_status ON motorcycles(status);
CREATE INDEX IF NOT EXISTS idx_motorcycles_category_id ON motorcycles(category_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_price ON motorcycles(price);
CREATE INDEX IF NOT EXISTS idx_motorcycles_year_model ON motorcycles(year_model);
CREATE INDEX IF NOT EXISTS idx_motorcycles_mileage ON motorcycles(mileage);
CREATE INDEX IF NOT EXISTS idx_motorcycles_featured ON motorcycles(featured);
CREATE INDEX IF NOT EXISTS idx_motorcycles_published_at ON motorcycles(published_at);
CREATE INDEX IF NOT EXISTS idx_motorcycles_ownership_type ON motorcycles(ownership_type);
CREATE INDEX IF NOT EXISTS idx_motorcycles_operation_type ON motorcycles(operation_type);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_motorcycle_id ON leads(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_motorcycle_id ON analytics_events(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_rentals_motorcycle_id ON rentals(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_start_date ON rentals(start_date);
CREATE INDEX IF NOT EXISTS idx_rentals_end_date ON rentals(end_date);

-- 6. Triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_motorcycle_categories_updated_at ON motorcycle_categories;
CREATE TRIGGER update_motorcycle_categories_updated_at BEFORE UPDATE ON motorcycle_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_motorcycles_updated_at ON motorcycles;
CREATE TRIGGER update_motorcycles_updated_at BEFORE UPDATE ON motorcycles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_motorcycle_images_updated_at ON motorcycle_images;
CREATE TRIGGER update_motorcycle_images_updated_at BEFORE UPDATE ON motorcycle_images FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_motorcycle_features_updated_at ON motorcycle_features;
CREATE TRIGGER update_motorcycle_features_updated_at BEFORE UPDATE ON motorcycle_features FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_motorcycle_owners_updated_at ON motorcycle_owners;
CREATE TRIGGER update_motorcycle_owners_updated_at BEFORE UPDATE ON motorcycle_owners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_consignments_updated_at ON consignments;
CREATE TRIGGER update_consignments_updated_at BEFORE UPDATE ON consignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_rental_settings_updated_at ON rental_settings;
CREATE TRIGGER update_rental_settings_updated_at BEFORE UPDATE ON rental_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_rentals_updated_at ON rentals;
CREATE TRIGGER update_rentals_updated_at BEFORE UPDATE ON rentals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_sell_requests_updated_at ON sell_requests;
CREATE TRIGGER update_sell_requests_updated_at BEFORE UPDATE ON sell_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_consignment_requests_updated_at ON consignment_requests;
CREATE TRIGGER update_consignment_requests_updated_at BEFORE UPDATE ON consignment_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_motorcycle_requests_updated_at ON motorcycle_requests;
CREATE TRIGGER update_motorcycle_requests_updated_at BEFORE UPDATE ON motorcycle_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Storage
-- Note: creating buckets requires permissions on the storage schema. Assuming normal supbase migrations handle this:
INSERT INTO storage.buckets (id, name, public) VALUES ('motorcycle-images', 'motorcycle-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('sell-request-images', 'sell-request-images', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('consignment-request-images', 'consignment-request-images', false) ON CONFLICT (id) DO NOTHING;

-- 8. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_feature_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_request_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_request_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE motorcycle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 9. Policies
-- Categories: Anyone can read active categories
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Active categories are public" ON motorcycle_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Active features are public" ON motorcycle_features FOR SELECT USING (is_active = true);
CREATE POLICY "Feature assignments are public" ON motorcycle_feature_assignments FOR SELECT USING (true);
CREATE POLICY "Motorcycle images are public" ON motorcycle_images FOR SELECT USING (true);
CREATE POLICY "Published motorcycles are public" ON motorcycles FOR SELECT USING (status != 'UNAVAILABLE' AND status != 'HIDDEN' AND published_at IS NOT NULL);
CREATE POLICY "Site settings are public" ON site_settings FOR SELECT USING (true);

-- Allow public to insert leads and requests
CREATE POLICY "Anyone can create leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create sell requests" ON sell_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can upload sell request images" ON sell_request_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create consignment requests" ON consignment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can upload consignment request images" ON consignment_request_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create motorcycle requests" ON motorcycle_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Admin Policies
CREATE POLICY "Admins have full access to profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to motorcycle_categories" ON motorcycle_categories FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to motorcycles" ON motorcycles FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to motorcycle_images" ON motorcycle_images FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to motorcycle_features" ON motorcycle_features FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to motorcycle_feature_assignments" ON motorcycle_feature_assignments FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to motorcycle_owners" ON motorcycle_owners FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to consignments" ON consignments FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to sales" ON sales FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to rental_settings" ON rental_settings FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to rentals" ON rentals FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to leads" ON leads FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to sell_requests" ON sell_requests FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to sell_request_images" ON sell_request_images FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to consignment_requests" ON consignment_requests FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to consignment_request_images" ON consignment_request_images FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to motorcycle_requests" ON motorcycle_requests FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to analytics_events" ON analytics_events FOR ALL USING (is_admin());
CREATE POLICY "Admins have full access to site_settings" ON site_settings FOR ALL USING (is_admin());

-- 10. Views
-- Secure public view for motorcycles to ensure we never leak license plates or ownership info
CREATE OR REPLACE VIEW public_motorcycles AS
SELECT
    m.id,
    m.slug,
    m.internal_code,
    m.brand,
    m.model,
    m.version,
    m.year_manufacture,
    m.year_model,
    m.mileage,
    m.engine_capacity,
    m.fuel,
    m.transmission,
    m.color,
    m.price,
    m.description,
    m.status,
    m.featured,
    m.published_at,
    m.category_id,
    m.operation_type,
    m.created_at,
    m.updated_at
FROM motorcycles m
WHERE m.status != 'UNAVAILABLE' AND m.status != 'HIDDEN' AND m.published_at IS NOT NULL;
