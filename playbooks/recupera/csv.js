/**
 * Recupera CSV import — plain script for Worker concat (before api.js).
 */
const RECUPERA_CSV_COLUMN_ALIASES = {
  payerName: ['payername', 'name', 'nombre'],
  payerEmail: ['payeremail', 'email', 'correo'],
  payerPhone: ['payerphone', 'phone', 'telefono', 'teléfono', 'telefono'],
  reference: ['reference', 'factura', 'invoice', 'ref'],
  description: ['description', 'desc'],
  amountCents: ['amountcents'],
  amount: ['amount'],
  monto: ['monto'],
  dueDate: ['duedate', 'vence', 'due', 'fecha'],
  currency: ['currency'],
};

function recuperaCsvNormalizeHeader(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_\s-]+/g, '');
}

function recuperaCsvParseLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function recuperaCsvResolveColumnIndexes(headers) {
  const indexes = {};
  const normalized = headers.map(recuperaCsvNormalizeHeader);
  for (const [field, aliases] of Object.entries(RECUPERA_CSV_COLUMN_ALIASES)) {
    const aliasSet = aliases.map(recuperaCsvNormalizeHeader);
    const index = normalized.findIndex((header) => aliasSet.includes(header));
    if (index >= 0) indexes[field] = index;
  }
  return indexes;
}

function recuperaCsvParseAmount(rawValue, field) {
  const raw = String(rawValue ?? '').trim();
  if (!raw) return null;
  const normalized = raw.replace(/,/g, '');
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  if (field === 'amountCents') return Math.round(numeric);
  if (field === 'monto') {
    if (/[.,]/.test(raw)) return Math.round(numeric * 100);
    return numeric < 1e6 ? Math.round(numeric * 100) : Math.round(numeric);
  }
  if (field === 'amount') {
    return numeric < 1e6 ? Math.round(numeric * 100) : Math.round(numeric);
  }
  return Math.round(numeric);
}

function recuperaCsvCell(row, indexes, field) {
  const index = indexes[field];
  if (index == null) return '';
  return row[index] ?? '';
}

function parseRecuperaObligationsCsv(text) {
  const raw = String(text || '').trim();
  if (!raw) return { obligations: [], error: 'csv_empty' };
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return { obligations: [], error: 'csv_header_required' };
  const headers = recuperaCsvParseLine(lines[0]);
  const indexes = recuperaCsvResolveColumnIndexes(headers);
  if (indexes.payerName == null) return { obligations: [], error: 'csv_missing_payer_name_column' };
  if (indexes.dueDate == null && indexes.amount == null && indexes.amountCents == null && indexes.monto == null) {
    return { obligations: [], error: 'csv_missing_required_columns' };
  }
  const obligations = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const row = recuperaCsvParseLine(lines[lineIndex]);
    if (!row.some((cell) => String(cell).trim())) continue;
    let amountCents = null;
    if (indexes.amountCents != null) amountCents = recuperaCsvParseAmount(recuperaCsvCell(row, indexes, 'amountCents'), 'amountCents');
    if (amountCents == null && indexes.amount != null) amountCents = recuperaCsvParseAmount(recuperaCsvCell(row, indexes, 'amount'), 'amount');
    if (amountCents == null && indexes.monto != null) amountCents = recuperaCsvParseAmount(recuperaCsvCell(row, indexes, 'monto'), 'monto');
    obligations.push({
      payerName: recuperaCsvCell(row, indexes, 'payerName'),
      payerEmail: recuperaCsvCell(row, indexes, 'payerEmail') || undefined,
      payerPhone: recuperaCsvCell(row, indexes, 'payerPhone') || undefined,
      reference: recuperaCsvCell(row, indexes, 'reference') || undefined,
      description: recuperaCsvCell(row, indexes, 'description') || undefined,
      amountCents,
      dueDate: recuperaCsvCell(row, indexes, 'dueDate'),
      currency: recuperaCsvCell(row, indexes, 'currency') || undefined,
    });
  }
  return { obligations };
}
