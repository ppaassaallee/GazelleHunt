/**
 * Recupera stage playbooks — plain script for Worker concat (before api.js).
 * Intensity bands follow OneSource: preventivo → temprano → medio → consecuencia.
 * Strategy modulates delay and Rocío (voice) placement; templates travel with the band.
 */

const RECUPERA_ROCIO_MODES = ['off', 'if_no_reply', 'stage'];

function recuperaStrategyKeyOrDefault(value) {
  const key = String(value || '').trim().toUpperCase();
  if (key === 'AMABLE' || key === 'EQUILIBRADA' || key === 'FIRME') return key;
  return 'EQUILIBRADA';
}

function recuperaNormalizeRocioMode(value) {
  const key = String(value || '').trim();
  return RECUPERA_ROCIO_MODES.includes(key) ? key : 'if_no_reply';
}

function recuperaIntensityBand(stageKey) {
  const key = String(stageKey || '');
  if (key === 'PRE_DUE' || key === 'DUE') return 'preventivo';
  if (key === 'DPD_1_7' || key === 'DPD_8_15' || key === 'DPD_16_30' || key === 'PROMISE') return 'temprano';
  if (key === 'DPD_31_60') return 'medio';
  if (key === 'DPD_60_PLUS' || key === 'LEGAL' || key === 'DISPUTE') return 'avanzado';
  return 'temprano';
}

function recuperaStrategyDelayScale(strategyKey) {
  if (strategyKey === 'AMABLE') return 1.5;
  if (strategyKey === 'FIRME') return 0.55;
  return 1;
}

function recuperaScaleHours(hours, strategyKey) {
  return Math.max(0, Math.round(Number(hours) * recuperaStrategyDelayScale(strategyKey)));
}

/**
 * Returns draft step defs for normalizedJourneySteps({ channel, delayHours, subject*, message* }).
 */
function recuperaStagePlaybookDrafts(strategyKey, stageKey, rocioMode) {
  const strategy = recuperaStrategyKeyOrDefault(strategyKey);
  const mode = recuperaNormalizeRocioMode(rocioMode);
  const band = recuperaIntensityBand(stageKey);
  const drafts = [];

  if (band === 'preventivo') {
    drafts.push({
      channel: 'whatsapp',
      delayHours: recuperaScaleHours(0, strategy),
      subjectEn: 'Upcoming payment',
      subjectEs: 'Pago próximo',
      messageEn: 'Hi {{name}}, a friendly reminder from {{brand}}: your payment date is coming up. Reference: {{role}}.',
      messageEs: 'Hola {{name}}, recordatorio de {{brand}}: se acerca su fecha de pago. Referencia: {{role}}.',
    });
    drafts.push({
      channel: 'email',
      delayHours: recuperaScaleHours(24, strategy),
      subjectEn: 'Payment date reminder',
      subjectEs: 'Recordatorio de fecha de pago',
      messageEn: 'Hi {{name}}, this is a service reminder from {{brand}} about your upcoming balance. Reference: {{role}}.',
      messageEs: 'Hola {{name}}, recordatorio de servicio de {{brand}} sobre su saldo próximo a vencer. Referencia: {{role}}.',
    });
  } else if (band === 'temprano') {
    drafts.push({
      channel: 'whatsapp',
      delayHours: recuperaScaleHours(0, strategy),
      subjectEn: 'Balance follow-up',
      subjectEs: 'Seguimiento de saldo',
      messageEn: 'Hi {{name}}, {{brand}} here — we noticed an open balance. We can help you settle it. Reference: {{role}}.',
      messageEs: 'Hola {{name}}, le escribe {{brand}}. Hay un saldo pendiente; podemos ayudarle a regularizarlo. Referencia: {{role}}.',
    });
    drafts.push({
      channel: 'email',
      delayHours: recuperaScaleHours(24, strategy),
      subjectEn: 'Flexible options to get current',
      subjectEs: 'Opciones para ponerse al día',
      messageEn: 'Hi {{name}}, we want to help you get current with {{brand}}. Reply or use your payment link. Reference: {{role}}.',
      messageEs: 'Hola {{name}}, queremos ayudarle a ponerse al día con {{brand}}. Responda o use su link de pago. Referencia: {{role}}.',
    });
    drafts.push({
      channel: 'sms',
      delayHours: recuperaScaleHours(72, strategy),
      subjectEn: 'Reminder',
      subjectEs: 'Recordatorio',
      messageEn: '{{brand}}: open balance reminder for {{name}}. Ref {{role}}.',
      messageEs: '{{brand}}: recordatorio de saldo para {{name}}. Ref {{role}}.',
    });
  } else if (band === 'medio') {
    drafts.push({
      channel: 'whatsapp',
      delayHours: recuperaScaleHours(0, strategy),
      subjectEn: 'Urgent balance',
      subjectEs: 'Saldo urgente',
      messageEn: 'Hi {{name}}, your balance with {{brand}} needs attention now to avoid further escalation. Reference: {{role}}.',
      messageEs: 'Hola {{name}}, su saldo con {{brand}} requiere atención ahora para evitar un escalamiento. Referencia: {{role}}.',
    });
    drafts.push({
      channel: 'email',
      delayHours: recuperaScaleHours(12, strategy),
      subjectEn: 'Action required on your account',
      subjectEs: 'Acción requerida en su cuenta',
      messageEn: 'Hi {{name}}, please act on your {{brand}} balance today. Limited options remain. Reference: {{role}}.',
      messageEs: 'Hola {{name}}, actúe hoy sobre su saldo con {{brand}}. Quedan pocas opciones. Referencia: {{role}}.',
    });
    drafts.push({
      channel: 'sms',
      delayHours: recuperaScaleHours(36, strategy),
      subjectEn: 'Action needed',
      subjectEs: 'Acción necesaria',
      messageEn: '{{brand}}: action needed on balance. Ref {{role}}.',
      messageEs: '{{brand}}: acción necesaria sobre su saldo. Ref {{role}}.',
    });
  } else {
    drafts.push({
      channel: 'email',
      delayHours: recuperaScaleHours(0, strategy),
      subjectEn: 'Account escalation notice',
      subjectEs: 'Aviso de escalamiento de cuenta',
      messageEn: 'Hi {{name}}, this is a formal notice from {{brand}} regarding prolonged non-payment. Reference: {{role}}. Further delay may lead to human specialist review.',
      messageEs: 'Hola {{name}}, aviso formal de {{brand}} por mora prolongada. Referencia: {{role}}. La demora puede derivar a revisión por un especialista.',
    });
    drafts.push({
      channel: 'whatsapp',
      delayHours: recuperaScaleHours(6, strategy),
      subjectEn: 'Consequence notice',
      subjectEs: 'Aviso de consecuencia',
      messageEn: '{{brand}}: your case may be escalated if unpaid. Ref {{role}}. Contact us today.',
      messageEs: '{{brand}}: su caso puede escalarse si no se regulariza. Ref {{role}}. Contáctenos hoy.',
    });
  }

  const wantsRocio =
    mode === 'stage' ||
    (mode === 'if_no_reply' && (band === 'temprano' || band === 'medio' || band === 'avanzado')) ||
    (mode === 'if_no_reply' && strategy === 'FIRME' && band === 'preventivo');

  if (wantsRocio && mode !== 'off') {
    const voiceDelay =
      mode === 'stage' || strategy === 'FIRME' || band === 'avanzado' || band === 'medio'
        ? recuperaScaleHours(band === 'avanzado' ? 12 : 48, strategy)
        : recuperaScaleHours(96, strategy);
    drafts.push({
      channel: 'voice',
      delayHours: voiceDelay,
      subjectEn: 'Rocio follow-up call',
      subjectEs: 'Llamada de seguimiento · Rocío',
      messageEn: 'Rocio calls {{name}} about the {{brand}} balance. Reference: {{role}}.',
      messageEs: 'Rocío llama a {{name}} sobre el saldo con {{brand}}. Referencia: {{role}}.',
    });
  }

  return drafts;
}

function recuperaResolveActivationStage(stageKey, includePreventive) {
  if (includePreventive === false && String(stageKey) === 'PRE_DUE') return 'DUE';
  return stageKey;
}

function recuperaJourneyNameFor(strategyKey, stageKey) {
  const strategy = recuperaStrategyKeyOrDefault(strategyKey);
  const stage = String(stageKey || 'DUE').slice(0, 40);
  return `Recupera · ${strategy} · ${stage}`;
}

function recuperaParseObligationMeta(row) {
  if (!row?.metadata_json) return {};
  try {
    const parsed = JSON.parse(row.metadata_json);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function recuperaPreviewLines(strategyKey, stageKey, rocioMode) {
  const drafts = recuperaStagePlaybookDrafts(strategyKey, stageKey, rocioMode);
  return drafts.map((step) => {
    const when = step.delayHours <= 0 ? 'Hoy' : step.delayHours < 24 ? `+${step.delayHours} h` : `+${Math.round(step.delayHours / 24)} d`;
    const channel =
      step.channel === 'whatsapp' ? 'WhatsApp'
        : step.channel === 'email' ? 'Email'
          : step.channel === 'sms' ? 'SMS'
            : step.channel === 'voice' ? 'Rocío (llamada)'
              : step.channel;
    return `${when} · ${channel}`;
  });
}
