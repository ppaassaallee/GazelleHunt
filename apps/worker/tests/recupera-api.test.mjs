import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const recuperaRoot = new URL('../../../playbooks/recupera/', import.meta.url);
const [stageSource, recomputeSource, promisesSource, csvSource, rocioSource, paymentsSource, apiSource, legacyServerSource, buildSource, auditSource, webhooksSource] = await Promise.all([
  readFile(new URL('stage.js', recuperaRoot), 'utf8'),
  readFile(new URL('recompute.js', recuperaRoot), 'utf8'),
  readFile(new URL('promises.js', recuperaRoot), 'utf8'),
  readFile(new URL('csv.js', recuperaRoot), 'utf8'),
  readFile(new URL('rocio.js', recuperaRoot), 'utf8'),
  readFile(new URL('payments.js', recuperaRoot), 'utf8'),
  readFile(new URL('api.js', recuperaRoot), 'utf8'),
  readFile(new URL('../src/legacy/server-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../build.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../../../packages/runtime/src/audit.js', import.meta.url), 'utf8'),
  readFile(new URL('../../../packages/runtime/src/webhooks.js', import.meta.url), 'utf8'),
]);

const serverSource = `${stageSource}\n${recomputeSource}\n${promisesSource}\n${csvSource}\n${paymentsSource}\n${apiSource}\n${auditSource}\n${webhooksSource}\n${legacyServerSource}`;

for (const route of [
  '/api/recupera/install',
  '/api/recupera/installation',
  '/api/recupera/obligations',
  '/api/recupera/obligations/import',
  '/api/recupera/obligations/',
  '/api/recupera/exceptions',
  '/api/recupera/insights',
  '/api/recupera/rocio/classify',
  '/inbound-message',
]) {
  assert.match(apiSource, new RegExp(route.replaceAll('/', '\\/')));
  assert.match(serverSource, /handleRecuperaApi/);
}

assert.match(apiSource, /\/activate/);
assert.match(apiSource, /mark-paid/);
assert.match(apiSource, /portal-link/);
assert.match(apiSource, /payment-link/);
assert.match(apiSource, /recuperaCreatePaymentLinkRequest/);
assert.match(paymentsSource, /createPaymentLinkStub/);
assert.match(paymentsSource, /recuperaHandlePaymentWebhook/);
assert.match(paymentsSource, /RECUPERA_PAYMENTS_ENABLED/);
assert.match(paymentsSource, /RECUPERA_PAYMENTS_WEBHOOK_SECRET/);
assert.match(paymentsSource, /X-Recupera-Payments-Secret/);
assert.match(paymentsSource, /recupera_obligation_paid_via_webhook/);
assert.match(serverSource, /\/api\/recupera\/payments\/webhook/);
assert.match(serverSource, /recuperaHandlePaymentWebhook/);
assert.match(serverSource, /serveRecuperaLanding/);
assert.match(serverSource, /Recupera más\. Persigue menos\./);
assert.match(serverSource, /\/recupera/);
assert.match(buildSource, /recuperaPayments/);
assert.match(apiSource, /obligation_portal_links/);
assert.match(apiSource, /recupera_obligation_activated/);
assert.match(apiSource, /RECUPERA_MARK_PAID_ENABLED/);
assert.match(apiSource, /test_recupera_obligation/);
assert.match(apiSource, /payment_received/);
assert.match(apiSource, /\/api\/recupera\/exceptions/);
assert.match(apiSource, /recuperaListExceptions/);
assert.match(apiSource, /recuperaResolveException/);
assert.match(apiSource, /pending_verification/);
assert.match(apiSource, /needs_human/);
assert.match(apiSource, /rocio_intent_jobs/);
assert.match(apiSource, /sqlite_master/);
assert.match(apiSource, /rocioClassifyIntent/);
assert.match(apiSource, /rocioProcessInbound/);
assert.match(apiSource, /recuperaClassifyIntentRequest/);
assert.match(apiSource, /recuperaInboundMessageRequest/);
assert.match(apiSource, /recuperaGetInsights/);
assert.match(apiSource, /pendingCents/);
assert.match(apiSource, /recoveredCentsThisMonth/);
assert.match(recomputeSource, /recuperaRecomputeStages/);
assert.match(promisesSource, /recuperaSweepBrokenPromises/);
assert.match(serverSource, /recuperaRecomputeStages\(env\)/);
assert.match(serverSource, /recuperaSweepBrokenPromises\(env\)/);
assert.match(serverSource, /RECUPERA_SELF_SERVE/);
assert.match(serverSource, /recupera_self_serve_signup/);
assert.match(buildSource, /recuperaRecompute/);
assert.match(buildSource, /recuperaPromises/);
assert.match(rocioSource, /rocioMaybeProcessInfobipInbound/);
assert.match(rocioSource, /RECUPERA_ROCIO_INBOUND/);

assert.match(apiSource, /playbook_disabled/);
assert.match(apiSource, /RECUPERA_ENABLED === 'true'/);
assert.match(apiSource, /playbooks_enabled_json/);
assert.match(apiSource, /playbook_installed/);
assert.match(apiSource, /recupera_obligations_imported/);
assert.match(apiSource, /autoActivate/);
assert.match(apiSource, /activationErrors/);
assert.match(apiSource, /parseRecuperaObligationsCsv/);
assert.match(csvSource, /parseRecuperaObligationsCsv/);
assert.match(csvSource, /recuperaCsvParseAmount/);
assert.match(apiSource, /RECUPERA_IMPORT_MAX_ROWS = 500/);
assert.match(buildSource, /recuperaRoot/);
assert.match(buildSource, /recuperaStage/);
assert.match(buildSource, /recuperaCsv/);
assert.match(buildSource, /recuperaRocio/);
assert.match(buildSource, /recuperaPayments/);
assert.match(buildSource, /recuperaApi/);
assert.match(buildSource, /recuperaPortalApi/);

const NOW = new Date('2026-09-04T12:00:00.000Z');
const stageContext = { globalThis: null, Date, Math, Number, String, Object, Array, JSON, console };
stageContext.globalThis = stageContext;
vm.runInNewContext(`${stageSource}\n;globalThis.__recuperaStage = { recuperaStageFromDueDate, recuperaIsoDateValid };`, stageContext);
const stage = stageContext.__recuperaStage;
assert.equal(stage.recuperaStageFromDueDate('2026-09-05', NOW), 'PRE_DUE');
assert.equal(stage.recuperaStageFromDueDate('2026-09-04', NOW), 'DUE');
assert.equal(stage.recuperaStageFromDueDate('2026-08-28', NOW), 'DPD_1_7');
assert.equal(stage.recuperaStageFromDueDate('2026-07-05', NOW), 'DPD_60_PLUS');
assert.equal(stage.recuperaIsoDateValid('2026-09-01'), true);
assert.equal(stage.recuperaIsoDateValid('09/01/2026'), false);

const csvContext = { globalThis: null, String, Number, Math, Object, Array, JSON, console };
csvContext.globalThis = csvContext;
vm.runInNewContext(`${csvSource}\n;globalThis.__recuperaCsv = { parseRecuperaObligationsCsv };`, csvContext);
const csv = csvContext.__recuperaCsv;
const parsedCsv = csv.parseRecuperaObligationsCsv(
  'payerName,payerEmail,payerPhone,reference,amount,dueDate\nAna,ana@example.com,502555,FAC-1,4500,2026-09-01',
);
assert.equal(parsedCsv.obligations.length, 1);
assert.equal(parsedCsv.obligations[0].payerName, 'Ana');
assert.equal(parsedCsv.obligations[0].amountCents, 450000);
assert.equal(parsedCsv.obligations[0].dueDate, '2026-09-01');
assert.equal(csv.parseRecuperaObligationsCsv('name,monto,vence\nLuis,125.50,2026-10-01').obligations[0].amountCents, 12550);

const auditCalls = [];
const dbState = {
  companies: [{ id: 'co-1', status: 'active', playbooks_enabled_json: null }],
  playbook_installations: [],
  obligations: [],
  candidates: [],
  lists: [],
  listMembers: [],
  listTests: [],
  tests: [{ id: 'test_recupera_obligation', status: 'active', engine_key: 'recupera_obligation' }],
  journeys: [],
  journeySteps: [],
  enrollments: [],
  journeyEvents: [],
  obligationLinks: [],
  payments: [],
  promises: [],
  disputes: [],
  rocioIntentJobs: [],
};
const db = {
  prepare(sql) {
    const query = String(sql).replace(/\s+/g, ' ').trim();
    return {
      bind(...bindings) {
        return {
          async first() {
            if (query.includes('FROM companies WHERE id = ? AND status')) {
              return dbState.companies.find((row) => row.id === bindings[0] && row.status === 'active') || null;
            }
            if (query.includes('playbooks_enabled_json FROM companies')) {
              return dbState.companies.find((row) => row.id === bindings[0]) || null;
            }
            if (query.includes('FROM playbook_installations WHERE company_id = ? AND playbook_key = ?')) {
              return dbState.playbook_installations.find((row) => row.company_id === bindings[0] && row.playbook_key === bindings[1]) || null;
            }
            if (query.includes('FROM playbook_installations WHERE id = ?')) {
              return dbState.playbook_installations.find((row) => row.id === bindings[0]) || null;
            }
            if (query.includes('FROM obligations WHERE id = ? AND company_id = ?')) {
              return dbState.obligations.find((row) => row.id === bindings[0] && row.company_id === bindings[1]) || null;
            }
            if (query === 'SELECT * FROM obligations WHERE id = ?') {
              return dbState.obligations.find((row) => row.id === bindings[0]) || null;
            }
            if (query.includes('FROM obligation_journey_links ojl')) {
              const link = dbState.obligationLinks.find((row) => row.obligation_id === bindings[0]);
              if (!link) return null;
              const enrollment = dbState.enrollments.find((row) => row.id === link.enrollment_id);
              return enrollment ? { ...link, enrollment_status: enrollment.status } : null;
            }
            if (query.includes('FROM assessment_tests WHERE id = ? AND status')) {
              return dbState.tests.find((row) => row.id === bindings[0] && row.status === 'active') || null;
            }
            if (query.includes('FROM candidates WHERE company_id = ? AND email = ?')) {
              return dbState.candidates.find((row) => row.company_id === bindings[0] && row.email.toLowerCase() === String(bindings[1]).toLowerCase()) || null;
            }
            if (query.includes('FROM candidates WHERE id = ?')) {
              return dbState.candidates.find((row) => row.id === bindings[0]) || null;
            }
            if (query.includes('FROM candidate_lists WHERE company_id = ? AND name = ?')) {
              return dbState.lists.find((row) => row.company_id === bindings[0] && row.name === bindings[1] && row.status === 'active') || null;
            }
            if (query.includes('FROM contact_journeys j WHERE j.company_id = ? AND j.name = ?')) {
              return dbState.journeys.find((row) => row.company_id === bindings[0] && row.name === bindings[1] && row.test_id === bindings[2] && row.list_id === bindings[3] && row.status === 'active') || null;
            }
            if (query.includes('FROM contact_journeys WHERE id = ?')) {
              return dbState.journeys.find((row) => row.id === bindings[0]) || null;
            }
            if (query.includes('FROM contact_journey_enrollments WHERE journey_id = ? AND candidate_id = ?')) {
              return dbState.enrollments.find((row) => row.journey_id === bindings[0] && row.candidate_id === bindings[1] && row.test_id === bindings[2]) || null;
            }
            if (query.includes('SELECT candidate_id FROM contact_journey_enrollments WHERE id = ?')) {
              return dbState.enrollments.find((row) => row.id === bindings[0]) || null;
            }
            if (query.includes("FROM sqlite_master WHERE type = 'table'")) {
              const tableName = bindings[0];
              if (tableName === 'rocio_intent_jobs' && dbState.rocioIntentJobsTable) {
                return { name: 'rocio_intent_jobs' };
              }
              return null;
            }
            if (query.includes('FROM payments WHERE id = ? AND company_id = ?')) {
              return dbState.payments.find((row) => row.id === bindings[0] && row.company_id === bindings[1] && row.status === 'pending_verification') || null;
            }
            if (query.includes('FROM promises WHERE id = ? AND company_id = ?')) {
              return dbState.promises.find((row) => row.id === bindings[0] && row.company_id === bindings[1]) || null;
            }
            if (query.includes('FROM disputes WHERE id = ? AND company_id = ?')) {
              return dbState.disputes.find((row) => row.id === bindings[0] && row.company_id === bindings[1]) || null;
            }
            if (query.includes('COALESCE(SUM(balance_cents), 0) AS cents FROM obligations')) {
              const cents = dbState.obligations
                .filter((row) => row.company_id === bindings[0] && row.status === 'open')
                .reduce((sum, row) => sum + (Number(row.balance_cents) || 0), 0);
              return { cents };
            }
            if (query.includes('COALESCE(SUM(amount_cents), 0) AS cents FROM payments')) {
              const monthStart = bindings[1];
              const cents = dbState.payments
                .filter((row) => row.company_id === bindings[0] && row.status === 'completed' && row.paid_at >= monthStart)
                .reduce((sum, row) => sum + (Number(row.amount_cents) || 0), 0);
              return { cents };
            }
            if (query.includes('COUNT(*) AS count FROM obligations WHERE company_id = ? AND status = \'open\'')) {
              return { count: dbState.obligations.filter((row) => row.company_id === bindings[0] && row.status === 'open').length };
            }
            if (query.includes('COUNT(*) AS count FROM promises WHERE company_id = ? AND status = \'open\'')) {
              return { count: dbState.promises.filter((row) => row.company_id === bindings[0] && row.status === 'open').length };
            }
            if (query.includes('COUNT(*) AS count FROM promises') && query.includes('status = \'broken\'')) {
              const today = bindings[1];
              return {
                count: dbState.promises.filter((row) => row.company_id === bindings[0] && (row.status === 'broken' || (row.status === 'open' && row.promise_date < today))).length,
              };
            }
            if (query.includes('COUNT(*) AS count FROM disputes WHERE company_id = ? AND status = \'open\'')) {
              return { count: dbState.disputes.filter((row) => row.company_id === bindings[0] && row.status === 'open').length };
            }
            if (query.includes('COUNT(*) AS count FROM rocio_intent_jobs WHERE company_id = ? AND created_at >=')) {
              return { count: dbState.rocioIntentJobs.filter((row) => row.company_id === bindings[0] && row.created_at >= bindings[1]).length };
            }
            if (query.includes('COUNT(*) AS count FROM rocio_intent_jobs WHERE company_id = ? AND status = \'needs_human\'')) {
              return { count: dbState.rocioIntentJobs.filter((row) => row.company_id === bindings[0] && row.status === 'needs_human').length };
            }
            return null;
          },
          async all() {
            if (query.includes('FROM contact_journey_steps WHERE journey_id = ?')) {
              return { results: dbState.journeySteps.filter((row) => row.journey_id === bindings[0]) };
            }
            if (query.includes('FROM obligations WHERE company_id = ? ORDER BY')) {
              return { results: dbState.obligations.filter((row) => row.company_id === bindings[0]).slice(0, bindings[1]) };
            }
            if (query.includes('FROM obligations WHERE company_id = ? AND id IN')) {
              const ids = bindings.slice(1);
              return { results: dbState.obligations.filter((row) => row.company_id === bindings[0] && ids.includes(row.id)) };
            }
            if (query.includes('FROM promises p') && query.includes('JOIN obligations o')) {
              const today = bindings[1];
              return {
                results: dbState.promises
                  .filter((row) => row.company_id === bindings[0] && (row.status === 'broken' || (row.status === 'open' && row.promise_date < today)))
                  .map((row) => {
                    const obligation = dbState.obligations.find((o) => o.id === row.obligation_id) || {};
                    return { ...row, payer_name: obligation.payer_name, reference: obligation.reference, balance_cents: obligation.balance_cents, obligation_currency: obligation.currency };
                  }),
              };
            }
            if (query.includes('FROM disputes d') && query.includes('JOIN obligations o')) {
              return {
                results: dbState.disputes
                  .filter((row) => row.company_id === bindings[0] && row.status === 'open')
                  .map((row) => {
                    const obligation = dbState.obligations.find((o) => o.id === row.obligation_id) || {};
                    return { ...row, payer_name: obligation.payer_name, reference: obligation.reference, balance_cents: obligation.balance_cents, obligation_currency: obligation.currency };
                  }),
              };
            }
            if (query.includes('FROM payments py') && query.includes('JOIN obligations o')) {
              return {
                results: dbState.payments
                  .filter((row) => row.company_id === bindings[0] && row.status === 'pending_verification')
                  .map((row) => {
                    const obligation = dbState.obligations.find((o) => o.id === row.obligation_id) || {};
                    return { ...row, payer_name: obligation.payer_name, reference: obligation.reference, balance_cents: obligation.balance_cents, obligation_currency: obligation.currency };
                  }),
              };
            }
            if (query.includes('FROM rocio_intent_jobs j')) {
              return {
                results: dbState.rocioIntentJobs
                  .filter((row) => row.company_id === bindings[0] && row.status === 'needs_human')
                  .map((row) => {
                    const obligation = dbState.obligations.find((o) => o.id === row.obligation_id) || {};
                    return { ...row, payer_name: obligation.payer_name, reference: obligation.reference, balance_cents: obligation.balance_cents, obligation_currency: obligation.currency };
                  }),
              };
            }
            if (query.includes("stage_key IN ('DPD_60_PLUS', 'LEGAL')")) {
              return {
                results: dbState.obligations.filter((row) => row.company_id === bindings[0] && row.status === 'open' && ['DPD_60_PLUS', 'LEGAL'].includes(row.stage_key)),
              };
            }
            if (query.includes('GROUP BY stage_key') && query.includes('FROM obligations')) {
              const companyId = bindings[0];
              const allowedStages = bindings.slice(1);
              const grouped = new Map();
              for (const row of dbState.obligations) {
                if (row.company_id !== companyId || row.status !== 'open' || !allowedStages.includes(row.stage_key)) continue;
                const current = grouped.get(row.stage_key) || { stage_key: row.stage_key, cents: 0, count: 0 };
                current.cents += Number(row.balance_cents) || 0;
                current.count += 1;
                grouped.set(row.stage_key, current);
              }
              return { results: [...grouped.values()] };
            }
            return { results: [] };
          },
          async run() {
            if (query.startsWith('INSERT INTO playbook_installations')) {
              dbState.playbook_installations.push({
                id: bindings[0],
                company_id: bindings[1],
                playbook_key: bindings[2],
                playbook_version: bindings[3],
                status: 'active',
                config_json: null,
                installed_by_user_id: bindings[5],
                created_at: bindings[6],
                updated_at: bindings[7],
              });
            }
            if (query.startsWith('UPDATE companies SET playbooks_enabled_json')) {
              const company = dbState.companies.find((row) => row.id === bindings[1]);
              if (company) company.playbooks_enabled_json = bindings[0];
            }
            if (query.startsWith('INSERT INTO obligations')) {
              dbState.obligations.push({
                id: bindings[0],
                company_id: bindings[1],
                subject_candidate_id: null,
                payer_name: bindings[2],
                payer_email: bindings[3],
                payer_phone: bindings[4],
                reference: bindings[5],
                description: bindings[6],
                currency: bindings[7],
                amount_cents: bindings[8],
                balance_cents: bindings[9],
                due_date: bindings[10],
                stage_key: bindings[11],
                strategy_key: 'EQUILIBRADA',
                status: 'open',
                created_at: bindings[12],
                updated_at: bindings[13],
              });
            }
            if (query.startsWith('INSERT INTO candidates')) {
              dbState.candidates.push({
                id: bindings[0], company_id: bindings[1], owner_user_id: bindings[2], email: bindings[3],
                name: bindings[4], phone: bindings[5], role: bindings[6],
              });
            }
            if (query.startsWith('UPDATE candidates SET')) {
              const candidate = dbState.candidates.find((row) => row.id === bindings[4]);
              if (candidate) {
                candidate.name = bindings[0];
                candidate.phone = bindings[1];
                candidate.role = bindings[2];
              }
            }
            if (query.startsWith('UPDATE obligations SET subject_candidate_id')) {
              const obligation = dbState.obligations.find((row) => row.id === bindings[2]);
              if (obligation) {
                obligation.subject_candidate_id = bindings[0];
                obligation.updated_at = bindings[1];
              }
            }
            if (query.startsWith('UPDATE obligations SET balance_cents = 0')) {
              const obligation = dbState.obligations.find((row) => row.id === bindings[1]);
              if (obligation) {
                obligation.balance_cents = 0;
                obligation.stage_key = 'PAID';
                obligation.status = 'closed';
                obligation.updated_at = bindings[0];
              }
            }
            if (query.startsWith('INSERT INTO candidate_lists')) {
              dbState.lists.push({ id: bindings[0], company_id: bindings[1], owner_user_id: bindings[2], name: bindings[3], status: 'active' });
            }
            if (query.startsWith('INSERT INTO contact_journeys')) {
              dbState.journeys.push({
                id: bindings[0], company_id: bindings[1], list_id: bindings[2], test_id: bindings[3],
                created_by_user_id: bindings[4], name: bindings[5], status: 'active', goal_event: bindings[6],
              });
            }
            if (query.startsWith('INSERT INTO contact_journey_steps')) {
              dbState.journeySteps.push({
                id: bindings[0], journey_id: bindings[1], step_order: bindings[2], delay_minutes: bindings[3], channel: bindings[5],
              });
            }
            if (query.startsWith('INSERT OR IGNORE INTO contact_journey_enrollments')) {
              dbState.enrollments.push({
                id: bindings[0], journey_id: bindings[1], candidate_id: bindings[2], test_id: bindings[3], status: 'active',
              });
            }
            if (query.startsWith('INSERT OR IGNORE INTO obligation_journey_links')) {
              dbState.obligationLinks.push({
                obligation_id: bindings[0], enrollment_id: bindings[1], journey_id: bindings[2], stage_key: bindings[3], created_at: bindings[4],
              });
            }
            if (query.startsWith('INSERT INTO payments')) {
              dbState.payments.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                amount_cents: bindings[3],
                currency: bindings[4],
                status: query.includes('pending_verification') ? 'pending_verification' : 'completed',
                created_at: bindings[bindings.length - 1],
              });
            }
            if (query.startsWith('INSERT INTO obligation_portal_links')) {
              if (!dbState.obligationPortalLinks) dbState.obligationPortalLinks = [];
              dbState.obligationPortalLinks.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                token_hash: bindings[3],
                expires_at: bindings[4],
                created_at: bindings[5],
              });
            }
            if (query.startsWith('INSERT INTO promises')) {
              dbState.promises.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                amount_cents: bindings[3],
                promise_date: bindings[4],
                status: bindings[5] || 'open',
                source: bindings[6],
                created_at: bindings[7],
                updated_at: bindings[8],
              });
            }
            if (query.startsWith('INSERT INTO disputes')) {
              dbState.disputes.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                reason_code: bindings[3],
                notes: bindings[4],
                status: bindings[5] || 'open',
                created_at: bindings[6],
                updated_at: bindings[7],
              });
            }
            if (query.startsWith('INSERT INTO rocio_intent_jobs')) {
              dbState.rocioIntentJobs.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                message_id: bindings[3],
                status: bindings[4],
                input_json: bindings[5],
                output_json: bindings[6],
                confidence: bindings[7],
                created_at: bindings[10],
              });
            }
            if (query.includes("UPDATE obligations SET stage_key = 'PROMISE'")) {
              const obligation = dbState.obligations.find((row) => row.id === bindings[1]);
              if (obligation) {
                obligation.stage_key = 'PROMISE';
                obligation.updated_at = bindings[0];
              }
            }
            if (query.includes("UPDATE obligations SET stage_key = 'DISPUTE'")) {
              const obligation = dbState.obligations.find((row) => row.id === bindings[1]);
              if (obligation) {
                obligation.stage_key = 'DISPUTE';
                obligation.updated_at = bindings[0];
              }
            }
            if (query.startsWith('UPDATE candidates SET do_not_contact = 1')) {
              const candidate = dbState.candidates.find((row) => row.id === bindings[1] && row.company_id === bindings[2]);
              if (candidate) candidate.do_not_contact = 1;
            }
            if (query.startsWith('UPDATE payments SET status =')) {
              const payment = dbState.payments.find((row) => row.id === bindings[1]);
              if (payment) payment.status = 'completed';
            }
            if (query.startsWith('UPDATE promises SET status =')) {
              const promise = dbState.promises.find((row) => row.id === bindings[1]);
              if (promise) {
                promise.status = 'cancelled';
                promise.updated_at = bindings[0];
              }
            }
            if (query.startsWith('UPDATE disputes SET status =')) {
              const dispute = dbState.disputes.find((row) => row.id === bindings[1]);
              if (dispute) {
                dispute.status = 'closed';
                dispute.updated_at = bindings[0];
              }
            }
            return { success: true };
          },
        };
      },
    };
  },
  async batch(statements) {
    for (const statement of statements) await statement.run();
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

function cleanText(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function cleanEmail(value) {
  const email = cleanText(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function isSuperAdmin(user) {
  return Number(user.ryvoStaff) === 1;
}

function canManageCompanyAssets(user) {
  return isSuperAdmin(user) || user.role === 'admin';
}

async function audit(env, actor, type, entityType, entityId, payload) {
  auditCalls.push({ actor, type, entityType, entityId, payload });
}

async function ensureSchema() {}

function normalizedJourneySteps(steps) {
  return (Array.isArray(steps) ? steps : []).map((step, index) => ({
    id: `step-${index}`,
    step_order: index + 1,
    delay_minutes: Math.round((Number(step.delayHours) || 0) * 60),
    business_day_offset: null,
    channel: step.channel || 'email',
    template_name: `Step ${index + 1}`,
    brevo_template_id: null,
    subject_en: step.subjectEn || 'Subject',
    subject_es: step.subjectEs || 'Asunto',
    message_en: step.messageEn || 'Message',
    message_es: step.messageEs || 'Mensaje',
    api_url: null,
    api_method: 'POST',
    api_headers_json: null,
  }));
}

function scheduledJourneyStepDate(start, step) {
  return new Date(start.getTime() + (Number(step.delay_minutes) || 0) * 60 * 1000);
}

async function processDueJourneyEvents() {
  return { processed: 0 };
}

async function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function randomToken() {
  return 'portal-token-test';
}

const apiContext = {
  globalThis: null,
  crypto: webcrypto,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  JSON,
  URL,
  Response,
  console,
  json,
  cleanText,
  cleanEmail,
  isSuperAdmin,
  canManageCompanyAssets,
  audit,
  ensureSchema,
  normalizedJourneySteps,
  scheduledJourneyStepDate,
  processDueJourneyEvents,
  sha256,
  randomToken,
};
apiContext.globalThis = apiContext;
vm.runInNewContext(`${stageSource}\n${csvSource}\n${rocioSource}\n${paymentsSource}\n${apiSource}\n;globalThis.__recuperaApi = { handleRecuperaApi, recuperaPlaybookEnabled, recuperaGloballyEnabled, recuperaParsePlaybooksEnabled, recuperaActivateObligation, createPaymentLinkStub, recuperaHandlePaymentWebhook, recuperaPaymentsEnabled };`, apiContext);
const api = apiContext.__recuperaApi;
const adminUser = { id: 'admin-1', email: 'admin@example.com', role: 'admin', companyId: 'co-1', ryvoStaff: 0 };

const disabledEnv = { DB: db, RECUPERA_ENABLED: 'false' };
const disabledRequest = new Request('https://example.com/api/recupera/installation', { method: 'GET' });
const disabledResponse = await api.handleRecuperaApi(disabledRequest, disabledEnv, new URL(disabledRequest.url), adminUser);
assert.equal(disabledResponse.status, 404);
assert.deepEqual(await disabledResponse.json(), { error: 'not_found', code: 'playbook_disabled' });

dbState.companies[0].playbooks_enabled_json = JSON.stringify(['recupera']);
const enabledEnv = { DB: db, RECUPERA_ENABLED: 'false' };
const missingInstallation = await api.handleRecuperaApi(disabledRequest, enabledEnv, new URL(disabledRequest.url), adminUser);
assert.equal(missingInstallation.status, 404);
assert.deepEqual(await missingInstallation.json(), { error: 'not_found', code: 'installation_not_found' });

const installRequest = new Request('https://example.com/api/recupera/install', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
const installResponse = await api.handleRecuperaApi(installRequest, enabledEnv, new URL(installRequest.url), adminUser);
assert.equal(installResponse.status, 201);
const installBody = await installResponse.json();
assert.equal(installBody.installation.playbookKey, 'recupera');
assert.equal(installBody.installation.playbookVersion, '0.1.0');
assert.ok(auditCalls.some((entry) => entry.type === 'playbook_installed'));

const importRequest = new Request('https://example.com/api/recupera/obligations/import', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    obligations: [{
      payerName: 'Ana López',
      payerEmail: 'ana@example.com',
      payerPhone: '50255551212',
      reference: 'FAC-100',
      description: 'Factura',
      amountCents: 450000,
      balanceCents: 450000,
      dueDate: '2026-09-01',
      currency: 'GTQ',
    }],
    autoActivate: false,
  }),
});
const importResponse = await api.handleRecuperaApi(importRequest, enabledEnv, new URL(importRequest.url), adminUser);
assert.equal(importResponse.status, 201);
const importBody = await importResponse.json();
assert.equal(importBody.imported.length, 1);
assert.equal(importBody.imported[0].stageKey, 'DPD_1_7');
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_obligations_imported'));

const csvImportRequest = new Request('https://example.com/api/recupera/obligations/import', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    csv: 'payerName,reference,amount,dueDate\nCarlos,FAC-2,1200,2026-09-10',
    autoActivate: true,
  }),
});
const csvImportResponse = await api.handleRecuperaApi(csvImportRequest, enabledEnv, new URL(csvImportRequest.url), adminUser);
assert.equal(csvImportResponse.status, 201);
const csvImportBody = await csvImportResponse.json();
assert.equal(csvImportBody.imported.length, 1);
assert.equal(csvImportBody.imported[0].payerName, 'Carlos');
assert.equal(csvImportBody.imported[0].amountCents, 120000);
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_obligation_activated'));

assert.equal(await api.recuperaGloballyEnabled({ RECUPERA_ENABLED: 'true' }), true);
assert.equal(await api.recuperaGloballyEnabled({ RECUPERA_ENABLED: 'false' }), false);
assert.equal(api.recuperaParsePlaybooksEnabled(JSON.stringify(['recupera'])).includes('recupera'), true);
assert.equal(api.recuperaParsePlaybooksEnabled('not-json').length, 0);

const obligationId = importBody.imported[0].id;
const activateRequest = new Request(`https://example.com/api/recupera/obligations/${obligationId}/activate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
});
const activateResponse = await api.handleRecuperaApi(activateRequest, enabledEnv, new URL(activateRequest.url), adminUser);
assert.equal(activateResponse.status, 201);
const activateBody = await activateResponse.json();
assert.ok(activateBody.candidateId);
assert.ok(activateBody.journeyId);
assert.ok(activateBody.enrollmentId);
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_obligation_activated'));

const markPaidDisabled = new Request(`https://example.com/api/recupera/obligations/${obligationId}/mark-paid`, {
  method: 'POST',
  body: '{}',
});
const markPaidDisabledResponse = await api.handleRecuperaApi(markPaidDisabled, enabledEnv, new URL(markPaidDisabled.url), adminUser);
assert.equal(markPaidDisabledResponse.status, 404);

const markPaidEnv = { ...enabledEnv, RECUPERA_MARK_PAID_ENABLED: 'true' };
const markPaidResponse = await api.handleRecuperaApi(markPaidDisabled, markPaidEnv, new URL(markPaidDisabled.url), adminUser);
assert.equal(markPaidResponse.status, 200);
const markPaidBody = await markPaidResponse.json();
assert.equal(markPaidBody.obligation.stageKey, 'PAID');
assert.equal(markPaidBody.obligation.status, 'closed');
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_obligation_marked_paid'));

const exceptionsRequest = new Request('https://example.com/api/recupera/exceptions', { method: 'GET' });
const exceptionsResponse = await api.handleRecuperaApi(exceptionsRequest, markPaidEnv, new URL(exceptionsRequest.url), adminUser);
assert.equal(exceptionsResponse.status, 200);
const exceptionsBody = await exceptionsResponse.json();
assert.equal(exceptionsBody.summary.total, 0);
assert.equal(exceptionsBody.items.length, 0);

const openObligationId = webcrypto.randomUUID();
dbState.obligations.push({
  id: openObligationId,
  company_id: 'co-1',
  subject_candidate_id: null,
  payer_name: 'Luis Pérez',
  payer_email: null,
  payer_phone: null,
  reference: 'FAC-99',
  description: null,
  currency: 'GTQ',
  amount_cents: 200000,
  balance_cents: 200000,
  due_date: '2026-07-01',
  stage_key: 'DPD_60_PLUS',
  strategy_key: 'EQUILIBRADA',
  status: 'open',
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
});
const disputeId = webcrypto.randomUUID();
dbState.disputes.push({
  id: disputeId,
  company_id: 'co-1',
  obligation_id: openObligationId,
  reason_code: 'already_paid',
  notes: null,
  status: 'open',
  created_at: '2026-09-02T00:00:00.000Z',
  updated_at: '2026-09-02T00:00:00.000Z',
});
const paymentId = webcrypto.randomUUID();
dbState.payments.push({
  id: paymentId,
  company_id: 'co-1',
  obligation_id: openObligationId,
  amount_cents: 200000,
  currency: 'GTQ',
  status: 'pending_verification',
  created_at: '2026-09-03T00:00:00.000Z',
});
const promiseId = webcrypto.randomUUID();
dbState.promises.push({
  id: promiseId,
  company_id: 'co-1',
  obligation_id: openObligationId,
  amount_cents: 200000,
  promise_date: '2026-09-01',
  status: 'open',
  created_at: '2026-08-30T00:00:00.000Z',
  updated_at: '2026-08-30T00:00:00.000Z',
});

const exceptionsPopulated = await api.handleRecuperaApi(exceptionsRequest, markPaidEnv, new URL(exceptionsRequest.url), adminUser);
assert.equal(exceptionsPopulated.status, 200);
const populatedBody = await exceptionsPopulated.json();
assert.equal(populatedBody.summary.disputes, 1);
assert.equal(populatedBody.summary.pendingPayments, 1);
assert.equal(populatedBody.summary.brokenPromises, 1);
assert.equal(populatedBody.summary.total, 4);
assert.ok(populatedBody.items.some((item) => item.type === 'aging' && item.obligationId === openObligationId));

const resolvePaymentRequest = new Request(`https://example.com/api/recupera/exceptions/pending_payment/${paymentId}/resolve`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ resolution: 'confirm_paid' }),
});
const resolvePaymentResponse = await api.handleRecuperaApi(resolvePaymentRequest, markPaidEnv, new URL(resolvePaymentRequest.url), adminUser);
assert.equal(resolvePaymentResponse.status, 200);
assert.equal(dbState.payments.find((row) => row.id === paymentId)?.status, 'completed');
assert.equal(dbState.obligations.find((row) => row.id === openObligationId)?.status, 'closed');

const resolveDisputeRequest = new Request(`https://example.com/api/recupera/exceptions/dispute/${disputeId}/resolve`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ resolution: 'dismiss' }),
});
const resolveDisputeResponse = await api.handleRecuperaApi(resolveDisputeRequest, markPaidEnv, new URL(resolveDisputeRequest.url), adminUser);
assert.equal(resolveDisputeResponse.status, 200);
assert.equal(dbState.disputes.find((row) => row.id === disputeId)?.status, 'closed');

const resolvePromiseRequest = new Request(`https://example.com/api/recupera/exceptions/broken_promise/${promiseId}/resolve`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ resolution: 'dismiss' }),
});
const resolvePromiseResponse = await api.handleRecuperaApi(resolvePromiseRequest, markPaidEnv, new URL(resolvePromiseRequest.url), adminUser);
assert.equal(resolvePromiseResponse.status, 200);
assert.equal(dbState.promises.find((row) => row.id === promiseId)?.status, 'cancelled');

const classifyRequest = new Request('https://example.com/api/recupera/rocio/classify', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: 'Prometo pagar el viernes', obligationId }),
});
const classifyResponse = await api.handleRecuperaApi(classifyRequest, enabledEnv, new URL(classifyRequest.url), adminUser);
assert.equal(classifyResponse.status, 200);
const classifyBody = await classifyResponse.json();
assert.equal(classifyBody.classification.intent, 'PROMISE_TO_PAY');
assert.ok(classifyBody.classification.confidence >= 0.8);

const inboundRequest = new Request(`https://example.com/api/recupera/obligations/${csvImportBody.imported[0].id}/inbound-message`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: 'Ya pagué, adjunto comprobante de transferencia' }),
});
const inboundResponse = await api.handleRecuperaApi(inboundRequest, enabledEnv, new URL(inboundRequest.url), adminUser);
assert.equal(inboundResponse.status, 201);
const inboundBody = await inboundResponse.json();
assert.equal(inboundBody.classification.intent, 'ALREADY_PAID');
assert.equal(inboundBody.applied, true);
assert.equal(inboundBody.status, 'completed');
assert.ok(dbState.payments.some((row) => row.obligation_id === csvImportBody.imported[0].id && row.status === 'pending_verification'));
assert.equal(dbState.rocioIntentJobs.length, 1);

const insightsRequest = new Request('https://example.com/api/recupera/insights', { method: 'GET' });
const insightsResponse = await api.handleRecuperaApi(insightsRequest, markPaidEnv, new URL(insightsRequest.url), adminUser);
assert.equal(insightsResponse.status, 200);
const insightsBody = await insightsResponse.json();
assert.equal(typeof insightsBody.pendingCents, 'number');
assert.equal(typeof insightsBody.recoveredCentsThisMonth, 'number');
assert.ok(Array.isArray(insightsBody.aging));
assert.equal(insightsBody.aging.length, 7);
assert.equal(typeof insightsBody.rocio.jobsToday, 'number');
assert.equal(typeof insightsBody.rocio.needsHuman, 'number');

const stubLink = api.createPaymentLinkStub({ obligationId: 'obl-1', amountCents: 1000, currency: 'GTQ', successUrl: 'https://example.com/p/tok' });
assert.equal(stubLink.provider, 'stub');
assert.equal(stubLink.url, 'https://example.com/p/tok');
assert.equal(stubLink.externalId, 'stub_obl-1');

const webhookObligationId = csvImportBody.imported[0].id;
const paymentsDisabledWebhook = new Request('https://example.com/api/recupera/payments/webhook', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'X-Recupera-Payments-Secret': 'secret' },
  body: JSON.stringify({ obligationId: webhookObligationId, amountCents: 120000, providerPaymentId: 'pay-1', status: 'completed' }),
});
const paymentsDisabledResponse = await api.recuperaHandlePaymentWebhook(paymentsDisabledWebhook, enabledEnv);
assert.equal(paymentsDisabledResponse.status, 404);

const paymentsEnv = {
  ...enabledEnv,
  RECUPERA_PAYMENTS_ENABLED: 'true',
  RECUPERA_PAYMENTS_WEBHOOK_SECRET: 'test-secret',
  APP_BASE_URL: 'https://example.com',
};
const badSecretWebhook = await api.recuperaHandlePaymentWebhook(paymentsDisabledWebhook, paymentsEnv);
assert.equal(badSecretWebhook.status, 401);

const webhookRequest = new Request('https://example.com/api/recupera/payments/webhook', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'X-Recupera-Payments-Secret': 'test-secret' },
  body: JSON.stringify({ obligationId: webhookObligationId, amountCents: 120000, providerPaymentId: 'pay-webhook-1', status: 'completed' }),
});
const webhookResponse = await api.recuperaHandlePaymentWebhook(webhookRequest, paymentsEnv);
assert.equal(webhookResponse.status, 200);
const webhookBody = await webhookResponse.json();
assert.equal(webhookBody.ok, true);
assert.ok(webhookBody.paymentId);
const paidObligation = dbState.obligations.find((row) => row.id === webhookObligationId);
assert.equal(paidObligation.status, 'closed');
assert.equal(paidObligation.balance_cents, 0);
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_obligation_paid_via_webhook'));

dbState.obligations.push({
  id: 'obl-open-2',
  company_id: 'co-1',
  payer_name: 'Test',
  balance_cents: 50000,
  amount_cents: 50000,
  currency: 'GTQ',
  due_date: '2026-09-01',
  stage_key: 'DPD_1_7',
  status: 'open',
});
const paymentLinkRequest = new Request('https://example.com/api/recupera/obligations/obl-open-2/payment-link', { method: 'POST' });
const paymentLinkResponse = await api.handleRecuperaApi(paymentLinkRequest, paymentsEnv, new URL(paymentLinkRequest.url), adminUser);
assert.equal(paymentLinkResponse.status, 200);
const paymentLinkBody = await paymentLinkResponse.json();
assert.equal(paymentLinkBody.provider, 'stub');
assert.ok(paymentLinkBody.url);
assert.ok(paymentLinkBody.portalUrl);

console.log('recupera api tests passed');
