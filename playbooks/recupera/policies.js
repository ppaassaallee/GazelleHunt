/**
 * Recupera policy objects — no LLM logic here.
 * AI interprets inbound messages; policy decides what Rocío may execute.
 */

/** Base policy applied to all Recupera installations unless overridden in config_json. */
export const RECUPERA_BASE_POLICY = {
  id: 'recupera.base',
  version: '0.1.0',
  rules: {
    /** Rocío may suggest payment plans but never autonomously grant discounts above this %. */
    max_autonomous_discount_percent: 0,
    /** Human approval required for obligations above this amount (cents). */
    human_approval_threshold_cents: 500_000,
    /** Max days Rocío may accept for a payment promise without human review. */
    promise_max_days: 14,
    /** Channels allowed by default; per-state overrides in channel_rules. */
    allowed_channels: ['whatsapp', 'email', 'sms', 'voice'],
    /** Rocío must not send legal threats or litigation language autonomously. */
    no_autonomous_legal_threats: true,
    /** Respect opt-out and quiet hours before any outbound contact. */
    respect_contactability: true,
  },
};

/** Per-DPD channel rules — policy decides; AI does not override. */
export const RECUPERA_CHANNEL_RULES_BY_STATE = {
  PRE_DUE: { channels: ['email', 'whatsapp'] },
  DUE: { channels: ['whatsapp', 'email', 'sms'] },
  DPD_1_7: { channels: ['whatsapp', 'email', 'sms'] },
  DPD_8_15: { channels: ['whatsapp', 'email', 'sms', 'voice'] },
  DPD_16_30: { channels: ['whatsapp', 'email', 'sms', 'voice'] },
  DPD_31_60: { channels: ['whatsapp', 'email', 'sms', 'voice'] },
  DPD_60_PLUS: { channels: ['email', 'voice'] },
  PROMISE: { channels: ['whatsapp', 'email'] },
  DISPUTE: { channels: [] },
};

/** Example tenant override — stored in playbook_installations.config_json.policies. */
export const RECUPERA_EXAMPLE_TENANT_POLICY = {
  ...RECUPERA_BASE_POLICY,
  id: 'recupera.tenant.example',
  rules: {
    ...RECUPERA_BASE_POLICY.rules,
    max_autonomous_discount_percent: 5,
    promise_max_days: 7,
  },
};

export const RECUPERA_POLICIES = {
  base: RECUPERA_BASE_POLICY,
  example_tenant: RECUPERA_EXAMPLE_TENANT_POLICY,
};
