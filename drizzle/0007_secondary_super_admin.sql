DROP INDEX IF EXISTS users_single_active_super_admin;

DROP TRIGGER IF EXISTS users_super_admin_email_insert;
DROP TRIGGER IF EXISTS users_super_admin_email_update;

CREATE TRIGGER IF NOT EXISTS users_super_admin_allowlist_insert
BEFORE INSERT ON users
WHEN NEW.role = 'super_admin'
  AND lower(NEW.email) NOT IN ('david.alejandro.pa@gmail.com', 'karla.ms@alliedglobal.com')
BEGIN
  SELECT RAISE(ABORT, 'super_admin_email_restricted');
END;

CREATE TRIGGER IF NOT EXISTS users_super_admin_allowlist_update
BEFORE UPDATE OF role, email ON users
WHEN NEW.role = 'super_admin'
  AND lower(NEW.email) NOT IN ('david.alejandro.pa@gmail.com', 'karla.ms@alliedglobal.com')
BEGIN
  SELECT RAISE(ABORT, 'super_admin_email_restricted');
END;
