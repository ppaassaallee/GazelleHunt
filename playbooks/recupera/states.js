/** Recupera obligation lifecycle states — declarative data only. */
export const RECUPERA_STATES = [
  { key: 'PRE_DUE', label: 'Pre-vencimiento', terminal: false, dpd_min: null, dpd_max: -1 },
  { key: 'DUE', label: 'Vencido hoy', terminal: false, dpd_min: 0, dpd_max: 0 },
  { key: 'DPD_1_7', label: '1–7 días vencido', terminal: false, dpd_min: 1, dpd_max: 7 },
  { key: 'DPD_8_15', label: '8–15 días vencido', terminal: false, dpd_min: 8, dpd_max: 15 },
  { key: 'DPD_16_30', label: '16–30 días vencido', terminal: false, dpd_min: 16, dpd_max: 30 },
  { key: 'DPD_31_60', label: '31–60 días vencido', terminal: false, dpd_min: 31, dpd_max: 60 },
  { key: 'DPD_60_PLUS', label: '60+ días vencido', terminal: false, dpd_min: 61, dpd_max: null },
  { key: 'PROMISE', label: 'Promesa de pago', terminal: false },
  { key: 'DISPUTE', label: 'En disputa', terminal: false },
  { key: 'PAID', label: 'Pagado', terminal: true },
  { key: 'LEGAL', label: 'Escalado legal', terminal: true },
  { key: 'CLOSED', label: 'Cerrado', terminal: true },
];

export const RECUPERA_STATE_KEYS = RECUPERA_STATES.map((state) => state.key);

export const RECUPERA_TERMINAL_STATES = RECUPERA_STATES
  .filter((state) => state.terminal)
  .map((state) => state.key);
