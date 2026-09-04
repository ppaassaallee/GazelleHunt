/**
 * Recupera collection strategy presets — journey step templates as plain objects.
 * Not live DB writes; installed per tenant via playbook_installations.config_json.
 */

const gentleReminder = {
  step_order: 1,
  delay_minutes: 0,
  channel: 'whatsapp',
  template_key: 'recupera.reminder.gentle',
};

const emailFollowUp = {
  step_order: 2,
  delay_minutes: 1440,
  channel: 'email',
  template_key: 'recupera.reminder.email',
};

const smsNudge = {
  step_order: 3,
  delay_minutes: 2880,
  channel: 'sms',
  template_key: 'recupera.reminder.sms',
};

/** AMABLE — tono cordial, más tiempo entre contactos, WhatsApp primero. */
export const STRATEGY_AMABLE = {
  key: 'AMABLE',
  label: 'Amable',
  description: 'Recordatorios cordiales con espaciado amplio. Ideal para clientes con buen historial.',
  steps: [
    gentleReminder,
    { ...emailFollowUp, delay_minutes: 2880 },
    { ...smsNudge, delay_minutes: 5760 },
  ],
};

/** EQUILIBRADA — mezcla de canales y cadencia media. */
export const STRATEGY_EQUILIBRADA = {
  key: 'EQUILIBRADA',
  label: 'Equilibrada',
  description: 'Cadencia estándar con escalamiento gradual por DPD.',
  steps: [
    gentleReminder,
    emailFollowUp,
    smsNudge,
    {
      step_order: 4,
      delay_minutes: 4320,
      channel: 'voice',
      template_key: 'recupera.call.followup',
    },
  ],
};

/** FIRME — contactos más frecuentes y voz antes en el ciclo. */
export const STRATEGY_FIRME = {
  key: 'FIRME',
  label: 'Firme',
  description: 'Seguimiento frecuente con voz temprana. Para cartera de alto riesgo.',
  steps: [
    gentleReminder,
    { ...emailFollowUp, delay_minutes: 720 },
    { ...smsNudge, delay_minutes: 1440 },
    {
      step_order: 4,
      delay_minutes: 2160,
      channel: 'voice',
      template_key: 'recupera.call.urgent',
    },
    {
      step_order: 5,
      delay_minutes: 4320,
      channel: 'whatsapp',
      template_key: 'recupera.reminder.final',
    },
  ],
};

export const RECUPERA_STRATEGIES = {
  AMABLE: STRATEGY_AMABLE,
  EQUILIBRADA: STRATEGY_EQUILIBRADA,
  FIRME: STRATEGY_FIRME,
};

export const RECUPERA_STRATEGY_KEYS = Object.keys(RECUPERA_STRATEGIES);
