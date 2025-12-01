-- Zeige alle Benutzer mit ihren IDs
SELECT id, username, email, is_admin, created_at 
FROM users 
ORDER BY id ASC;
