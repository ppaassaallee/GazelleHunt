import { RECUPERA_STATES, RECUPERA_TERMINAL_STATES } from './states.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDueDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('invalid_due_date');
  return date;
}

function startOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function daysPastDue(dueDate, now) {
  const dueMs = startOfUtcDay(parseDueDate(dueDate));
  const nowMs = startOfUtcDay(now);
  return Math.floor((nowMs - dueMs) / MS_PER_DAY);
}

/** Map due date to PRE_DUE | DUE | DPD_* based on days past due. */
export function stageFromDueDate(dueDate, now = new Date()) {
  const dpd = daysPastDue(dueDate, now);
  for (const state of RECUPERA_STATES) {
    if (state.dpd_min === undefined && state.dpd_max === undefined) continue;
    const min = state.dpd_min ?? Number.NEGATIVE_INFINITY;
    const max = state.dpd_max ?? Number.POSITIVE_INFINITY;
    if (dpd >= min && dpd <= max) return state.key;
  }
  return 'DPD_60_PLUS';
}

export function nextStageAfterPayment() {
  return 'PAID';
}

export function nextStageAfterPromise() {
  return 'PROMISE';
}

/** After a broken promise, return the DPD bucket implied by the obligation due date. */
export function nextStageAfterBrokenPromise(current, now = new Date()) {
  const dueDate = current?.due_date ?? current?.dueDate;
  if (dueDate) return stageFromDueDate(dueDate, now);
  return 'DPD_1_7';
}

export function isTerminalStage(stageKey) {
  return RECUPERA_TERMINAL_STATES.includes(stageKey);
}
