-- Buat profile untuk user yang sudah ada sebelum migration
INSERT INTO profiles (id, role, is_active)
SELECT id, 'user', true
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Set admin@qbblastify.com sebagai superadmin
UPDATE profiles
SET role = 'superadmin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@qbblastify.com'
);
