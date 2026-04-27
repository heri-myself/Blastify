-- Profiles table untuk role management
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'user')),
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- User hanya bisa lihat profilnya sendiri
CREATE POLICY "users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

-- Superadmin bisa lihat semua profil
CREATE POLICY "superadmin can view all profiles"
  ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Trigger: otomatis buat profile saat user baru signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'role', 'user'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Superadmin policies untuk semua tabel
CREATE POLICY "superadmin can manage all sender_phones"
  ON sender_phones FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "superadmin can manage all contacts"
  ON contacts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "superadmin can manage all media_files"
  ON media_files FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "superadmin can manage all campaigns"
  ON campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "superadmin can manage all campaign_messages"
  ON campaign_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "superadmin can manage all campaign_contacts"
  ON campaign_contacts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "superadmin can view all delivery_logs"
  ON delivery_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Set admin@qbblastify.com sebagai superadmin
-- Jalankan setelah migration jika user sudah ada:
-- UPDATE profiles SET role = 'superadmin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@qbblastify.com');
