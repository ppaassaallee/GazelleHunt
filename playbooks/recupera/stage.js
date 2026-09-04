/**
 * Recupera stage helpers — plain script for Worker concat.
 * Logic mirrors playbooks/recupera/engine.js (ESM); keep DPD buckets in sync.
 */
const RECUPERA_DPD_STATES = [
  { key: 'PRE_DUE', dpd_min: null, dpd_max: -1 },
  { key: 'DUE', dpd_min: 0, dpd_max: 0 },
  { key: 'DPD_1_7', dpd_min: 1, dpd_max: 7 },
  { key: 'DPD_8_15', dpd_min: 8, dpd_max: 15 },
  { key: 'DPD_16_30', dpd_min: 16, dpd_max: 30 },
  { key: 'DPD_31_60', dpd_min: 31, dpd_max: 60 },
  { key: 'DPD_60_PLUS', dpd_min: 61, dpd_max: null },
];

const RECUPERA_MS_PER_DAY = 24 * 60 * 60 * 1000;

function recuperaParseDueDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('invalid_due_date');
  return date;
}

function recuperaStartOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function recuperaDaysPastDue(dueDate, now) {
  const dueMs = recuperaStartOfUtcDay(recuperaParseDueDate(dueDate));
  const nowMs = recuperaStartOfUtcDay(now);
  return Math.floor((nowMs - dueMs) / RECUPERA_MS_PER_DAY);
}

/** Map due date to PRE_DUE | DUE | DPD_* based on days past due. */
function recuperaStageFromDueDate(dueDate, now = new Date()) {
  const dpd = recuperaDaysPastDue(dueDate, now);
  for (const state of RECUPERA_DPD_STATES) {
    if (state.dpd_min === undefined && state.dpd_max === undefined) continue;
    const min = state.dpd_min ?? Number.NEGATIVE_INFINITY;
    const max = state.dpd_max ?? Number.POSITIVE_INFINITY;
    if (dpd >= min && dpd <= max) return state.key;
  }
  return 'DPD_60_PLUS';
}

function recuperaIsoDateValid(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  try {
    recuperaParseDueDate(value);
    return true;
  } catch {
    return false;
  }
}
