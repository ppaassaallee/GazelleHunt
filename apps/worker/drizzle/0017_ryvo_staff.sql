ALTER TABLE users ADD COLUMN ryvo_staff INTEGER NOT NULL DEFAULT 0;

UPDATE users SET ryvo_staff = 1 WHERE role = 'super_admin' AND status = 'active';

DROP TRIGGER IF EXISTS users_super_admin_allowlist_insert;
DROP TRIGGER IF EXISTS users_super_admin_allowlist_update;
DROP TRIGGER IF EXISTS users_super_admin_email_insert;
DROP TRIGGER IF EXISTS users_super_admin_email_update;
