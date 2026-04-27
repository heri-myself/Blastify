-- Jalankan script ini di Supabase SQL Editor SETELAH migration 002 selesai
-- Untuk set admin@qbblastify.com sebagai superadmin

UPDATE profiles
SET role = 'superadmin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@qbblastify.com'
);
