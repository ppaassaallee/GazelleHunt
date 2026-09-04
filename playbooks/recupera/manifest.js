import { RECUPERA_STATES } from './states.js';
import { RECUPERA_STRATEGIES } from './strategies.js';
import { RECUPERA_POLICIES } from './policies.js';

/** Recupera playbook manifest — declarative data, no runtime or DB imports. */
export const recuperaManifest = {
  id: 'recupera',
  version: '0.1.0',
  name: 'Recupera',
  outcome: 'RECOVER_PAYMENT',
  agent: 'rocio',
  goal_events: ['payment_received', 'promise_created'],
  stop_on_reply: false,
  stop_events: ['payment.received', 'dispute.opened', 'opt_out'],
  channels: ['whatsapp', 'email', 'sms', 'voice'],
  states: RECUPERA_STATES,
  strategies: RECUPERA_STRATEGIES,
  policies: RECUPERA_POLICIES,
};

export default recuperaManifest;
