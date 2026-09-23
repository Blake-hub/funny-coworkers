-- Fix the password hash for pre-created accounts
-- The original hash $2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq did not match "password", causing login failures
-- The new hash $2b$10$rfS1OtmgYaZ5GV50t1ibWuf5ohBd6/wcMbTud.bryVc9ej6zK/5JO corresponds to the plaintext "password"
UPDATE app_user SET password = '$2b$10$rfS1OtmgYaZ5GV50t1ibWuf5ohBd6/wcMbTud.bryVc9ej6zK/5JO'
WHERE email IN (
  'admin@example.com',
  'admin@pmis.com',
  'mike.johnson@pmis.com',
  'lisa.anderson@pmis.com',
  'emily.davis@pmis.com'
);
