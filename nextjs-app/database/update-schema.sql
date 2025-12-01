-- Update Schema: Add missing columns for Next.js migration
-- Run this to update your existing database

-- 1. Add is_admin column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Add is_linked column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_linked BOOLEAN NOT NULL DEFAULT false;

-- 3. Add shooter_id column (for Meyton shooter linking)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS shooter_id VARCHAR(100);

-- 4. Update status column to be nullable (we use is_linked now)
ALTER TABLE users 
ALTER COLUMN status DROP NOT NULL;

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_shooter_id ON users(shooter_id);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_linked ON users(is_linked);

-- 6. Optional: Set first user as admin
-- UPDATE users SET is_admin = true WHERE id = 1;

-- Verify changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

