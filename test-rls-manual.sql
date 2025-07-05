-- Manual RLS Test - Run these commands in Supabase SQL Editor after setup

-- 1. Create test agencies
INSERT INTO agencies (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES 
  ('test-agency-1', 'Test Agency 1', 'test-agency-1', true, NOW(), NOW()),
  ('test-agency-2', 'Test Agency 2', 'test-agency-2', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Set context to agency 1
SELECT set_current_agency_id('test-agency-1');

-- 3. Check context is set
SELECT get_current_agency_id() as current_agency;

-- 4. Get agency users (should return empty initially)
SELECT * FROM get_agency_users();

-- 5. Get current agency info
SELECT * FROM get_current_agency();

-- 6. Create test user in agency 1
SELECT create_agency_user(
  'test-user-1',
  'testuser1@example.com',
  'Test',
  'User',
  'USER'
);

-- 7. Verify user was created in agency 1
SELECT * FROM get_agency_users();

-- 8. Switch to agency 2
SELECT set_current_agency_id('test-agency-2');

-- 9. Verify agency 2 has no users (tenant isolation working)
SELECT * FROM get_agency_users();

-- 10. Create user in agency 2
SELECT create_agency_user(
  'test-user-2',
  'testuser2@example.com',
  'Test',
  'User Two',
  'USER'
);

-- 11. Verify agency 2 now has 1 user
SELECT * FROM get_agency_users();

-- 12. Switch back to agency 1 and verify it still has only its user
SELECT set_current_agency_id('test-agency-1');
SELECT * FROM get_agency_users();

-- 13. Clean up test data
SELECT clear_current_agency_id();
DELETE FROM users WHERE email LIKE 'testuser%@example.com';
DELETE FROM agencies WHERE slug LIKE 'test-agency-%';

-- If all these steps work, your RLS setup is complete!