/** Gazelle Hunt playbook manifest — Playbook #1, currently hosted in apps/worker legacy. */
export const gazelleHuntManifest = {
  id: 'gazelle-hunt',
  version: '1.0.0',
  name: 'Gazelle Hunt',
  outcome: 'ASSESSMENT_COMPLETED',
  agent: null,
  goal_events: ['assessment_completed'],
  stop_on_reply: true,
  stop_events: ['assessment.completed', 'opt_out'],
  channels: ['email', 'sms', 'whatsapp'],
};

export default gazelleHuntManifest;
