-- Create admin user helper script
-- Run this after signing up to grant admin privileges

-- Example: Replace 'admin' with your username
DO $$
DECLARE
    user_uuid UUID;
    admin_role_id INT;
BEGIN
    -- Get user ID
    SELECT id INTO user_uuid FROM users WHERE username = 'admin';
    
    -- Get admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    
    -- Assign admin role
    INSERT INTO user_roles (user_id, role_id)
    VALUES (user_uuid, admin_role_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user: %', user_uuid;
END $$;