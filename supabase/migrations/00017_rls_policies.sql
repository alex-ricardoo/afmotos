
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
