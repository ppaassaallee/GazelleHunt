DROP TRIGGER IF EXISTS users_super_admin_allowlist_insert;
DROP TRIGGER IF EXISTS users_super_admin_allowlist_update;

CREATE TRIGGER users_super_admin_allowlist_insert
BEFORE INSERT ON users
WHEN NEW.role = 'super_admin'
  AND lower(NEW.email) NOT IN (
    'david.alejandro.pa@gmail.com',
    'karla.ms@alliedglobal.com',
    'jose.le@alliedglobal.com',
    'daniela.ld@alliedglobal.com',
    'eduardo.ac@alliedglobal.com'
  )
BEGIN
  SELECT RAISE(ABORT, 'super_admin_email_restricted');
END;

CREATE TRIGGER users_super_admin_allowlist_update
BEFORE UPDATE OF role, email ON users
WHEN NEW.role = 'super_admin'
  AND lower(NEW.email) NOT IN (
    'david.alejandro.pa@gmail.com',
    'karla.ms@alliedglobal.com',
    'jose.le@alliedglobal.com',
    'daniela.ld@alliedglobal.com',
    'eduardo.ac@alliedglobal.com'
  )
BEGIN
  SELECT RAISE(ABORT, 'super_admin_email_restricted');
END;
