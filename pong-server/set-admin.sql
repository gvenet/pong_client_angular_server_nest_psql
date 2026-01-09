-- Script pour définir un utilisateur comme admin
-- Remplacez 'votre_username' par le nom d'utilisateur souhaité

-- Option 1: Par nom d'utilisateur
UPDATE users SET role = 'admin' WHERE username = 'votre_username';

-- Option 2: Par email
-- UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';

-- Vérifier le changement
SELECT id, username, email, role FROM users;
