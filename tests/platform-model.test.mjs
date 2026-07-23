import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [migration, passwordResetMigration, secondarySuperAdminMigration, expandedSuperAdminMigration, server, app] = await Promise.all([
  readFile(new URL('../drizzle/0003_multitenant_accounts_lists_tests.sql', import.meta.url), 'utf8'),
  readFile(new URL('../drizzle/0006_password_reset_tokens.sql', import.meta.url), 'utf8'),
  readFile(new URL('../drizzle/0007_secondary_super_admin.sql', import.meta.url), 'utf8'),
  readFile(new URL('../drizzle/0008_expand_super_admin_allowlist.sql', import.meta.url), 'utf8'),
  readFile(new URL('../server-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
]);

for (const table of [
  'companies', 'users', 'sessions', 'auth_rate_limits', 'assessment_tests',
  'candidate_lists', 'candidate_list_members', 'candidate_list_tests',
  'send_batches', 'send_batch_items',
]) assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));

assert.match(migration, /UNIQUE \(company_id, email\)/);
assert.match(migration, /users_single_active_super_admin/);
assert.match(migration, /david\.alejandro\.pa@gmail\.com/);
assert.match(migration, /test_tenure_potential/);
assert.match(passwordResetMigration, /CREATE TABLE IF NOT EXISTS password_reset_tokens/);
assert.match(passwordResetMigration, /password_reset_tokens_user_idx/);
assert.match(secondarySuperAdminMigration, /DROP INDEX IF EXISTS users_single_active_super_admin/);
assert.match(secondarySuperAdminMigration, /karla\.ms@alliedglobal\.com/);
assert.match(secondarySuperAdminMigration, /users_super_admin_allowlist_insert/);
for (const email of [
  'david.alejandro.pa@gmail.com',
  'karla.ms@alliedglobal.com',
  'jose.le@alliedglobal.com',
  'daniela.ld@alliedglobal.com',
  'eduardo.ac@alliedglobal.com',
]) assert.match(expandedSuperAdminMigration, new RegExp(email.replaceAll('.', '\\.')));
assert.match(expandedSuperAdminMigration, /DROP TRIGGER IF EXISTS users_super_admin_allowlist_insert/);
assert.match(expandedSuperAdminMigration, /CREATE TRIGGER users_super_admin_allowlist_update/);

assert.match(server, /user\.role === 'admin'/);
assert.match(server, /user\.role === 'super_admin'/);
assert.match(server, /owner_user_id = \?/);
assert.match(server, /company_id = \?/);
assert.match(server, /A batch can contain at most 500/);
assert.match(server, /createBulkResend/);
assert.match(server, /previous_invitation_required/);
assert.match(server, /attempt_limit_reached/);
assert.match(server, /engine_key = 'tenure_potential'/);
assert.match(server, /status: 'pending'/);
assert.match(server, /runtimeColumnMigrations/);
assert.match(server, /PRAGMA table_info/);
assert.match(server, /INSERT OR IGNORE INTO companies/);
assert.match(server, /INSERT OR IGNORE INTO assessment_tests/);
assert.match(server, /candidates_company_email_unique/);
assert.match(server, /listAssessmentResults/);
assert.match(server, /assessment_test_name_en/);
assert.match(server, /candidate_list_ids_csv/);

assert.match(app, /Lists and multi-test batches/);
assert.match(app, /A candidate can belong to multiple lists/);
assert.match(app, /Platform super administrators can approve accounts/);
assert.match(app, /Send access link/);
assert.match(app, /User access updated/);
assert.match(app, /Resend to/);
assert.match(app, /Select all eligible visible candidates/);
assert.match(app, /filteredReportResults/);
assert.match(app, /report-test-filter/);
assert.match(app, /report-scope-filter/);
assert.match(app, /report-list-filter/);
assert.match(app, /Auditoría de puntuación/);

console.log('Platform model tests passed.');
