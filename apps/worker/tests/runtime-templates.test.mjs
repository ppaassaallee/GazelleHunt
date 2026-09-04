import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const helpers = `
function cleanText(value, max) {
  return String(value || '').slice(0, max).trim();
}
function companyAssetScope(user, alias = '') {
  const prefix = alias ? \`\${alias}.\` : '';
  return { sql: \`\${prefix}company_id = ?\`, bindings: [user.companyId] };
}
function contactabilityConfig() {
  return { whatsapp: { providerKey: 'none', templateName: null, templateId: null, templateLanguage: 'es' } };
}
async function audit() {}
`;

const source = helpers + '\n' + await readFile(new URL('../../../packages/runtime/src/templates.js', import.meta.url), 'utf8');

const batches = [];
const context = {
  globalThis: null,
  crypto: webcrypto,
  Date,
  JSON,
  String,
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__templatesTest = {
  ensureDefaultMessageTemplates,
  listMessageTemplates,
  messageTemplateByReference,
};`, context);

const templates = context.__templatesTest;
assert.equal(typeof templates.ensureDefaultMessageTemplates, 'function');
assert.equal(typeof templates.listMessageTemplates, 'function');
assert.equal(typeof templates.messageTemplateByReference, 'function');

await templates.ensureDefaultMessageTemplates(
  {
    DB: {
      prepare(sql) {
        assert.match(sql, /INSERT OR IGNORE INTO message_templates/);
        return { bind() { return this; } };
      },
      async batch(statements) {
        batches.push(statements.length);
      },
    },
  },
  'org_1',
);
assert.equal(batches[0], 1);

const rows = await templates.listMessageTemplates(
  {
    DB: {
      prepare(sql) {
        assert.match(sql, /FROM message_templates mt/);
        return {
          bind() {
            return { async all() { return { results: [{ id: 'tpl_1', channel: 'email' }] }; } };
          },
        };
      },
    },
  },
  { companyId: 'org_1', role: 'admin' },
);
assert.equal(rows.length, 1);
assert.equal(rows[0].channel, 'email');

const byRef = await templates.messageTemplateByReference(
  {
    DB: {
      prepare(sql) {
        assert.match(sql, /provider_template_name = \?/);
        return {
          bind() {
            return { async first() { return { id: 'tpl_ref', name: 'Default' }; } };
          },
        };
      },
    },
  },
  { companyId: 'org_1', role: 'admin' },
  'org_1',
  'email',
  'gazelle_email_invitation',
);
assert.equal(byRef.id, 'tpl_ref');

console.log('Runtime templates module tests passed.');
