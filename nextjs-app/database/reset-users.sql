-- Reset Users: Delete all users and create default admin
-- Usage: psql -h localhost -U dbuser -d shooting_club -f reset-users.sql

\echo '🗑️  Deleting all users...'

-- Delete all users
DELETE FROM users;

-- Reset the sequence so IDs start from 1 again
ALTER SEQUENCE users_id_seq RESTART WITH 1;

\echo '✅ All users deleted!'
\echo ''
\echo '👤 Creating default admin user...'

-- Create default admin with password: admin123
-- You should change this password after first login!
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    is_admin, 
    is_linked, 
    shooter_id,
    created_at, 
    updated_at
) VALUES (
    'admin',
    'admin@shooting-club.local',
    -- Password: admin123 (hashed with bcrypt)
    '$2b$10$XQj8QBQqYjfK5lC0P0pqVe7GcY5YCZxXvH.wLBFjBJYLqB6XQm9Hq',
    true,
    false,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

\echo ''
\echo '✅ Default admin created!'
\echo ''
\echo '📋 Login Credentials:'
\echo '   Username: admin'
\echo '   Email:    admin@shooting-club.local'
\echo '   Password: admin123'
\echo ''
\echo '⚠️  IMPORTANT: Change this password after first login!'
\echo ''

-- Show the created user
SELECT 
    id, 
    username, 
    email, 
    is_admin, 
    is_linked,
    created_at
FROM users;

