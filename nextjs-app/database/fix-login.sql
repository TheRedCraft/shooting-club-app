-- Fix Login Issues: Rename password column and update structure

-- 1. Rename password to password_hash
ALTER TABLE users RENAME COLUMN password TO password_hash;

-- 2. Make shooter_id column work properly (should already exist)
-- Just verify it's there
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'shooter_id'
    ) THEN
        ALTER TABLE users ADD COLUMN shooter_id VARCHAR(100);
    END IF;
END $$;

-- 3. Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 4. Show all users
SELECT 
    id, 
    username, 
    email, 
    is_admin, 
    is_linked, 
    COALESCE(shooter_id, '(null)') as shooter_id
FROM users;

-- Done!
\echo '✅ Fixed! password -> password_hash'
\echo ''
\echo '💡 Now run: ./make-admin.sh your@email.com'

