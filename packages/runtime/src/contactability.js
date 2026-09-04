/**
 * Meikapen runtime — subject contact policies (opt-out, quiet hours, frequency caps).
 */
function subjectDoNotContact(subject) {
  return Number(subject?.do_not_contact ?? subject?.doNotContact ?? 0) === 1;
}

function subjectOptOutChannels(subject) {
  const raw = subject?.opt_out_channels_json ?? subject?.optOutChannelsJson ?? subject?.opt_out_channels ?? subject?.optOutChannels;
  if (Array.isArray(raw)) return raw.map(String);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function subjectQuietHoursStart(subject) {
  const value = subject?.quiet_hours_start ?? subject?.quietHoursStart;
  return value === null || value === undefined || value === '' ? 8 : Number(value);
}

function subjectQuietHoursEnd(subject) {
  const value = subject?.quiet_hours_end ?? subject?.quietHoursEnd;
  return value === null || value === undefined || value === '' ? 19 : Number(value);
}

function subjectTimezone(subject, defaultTimezone = 'America/Guatemala') {
  return cleanText(subject?.timezone, 80) || defaultTimezone || 'America/Guatemala';
}

function localPartsInTimezone(date, timezone) {
  const tz = timezone || 'America/Guatemala';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = {};
    for (const entry of formatter.formatToParts(date)) {
      if (entry.type !== 'literal') parts[entry.type] = Number(entry.value);
    }
    return parts;
  } catch {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    };
  }
}

function utcFromZonedParts(year, month, day, hour, minute, timeZone) {
  let ms = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = {};
    for (const entry of formatter.formatToParts(new Date(ms))) {
      if (entry.type !== 'literal') parts[entry.type] = Number(entry.value);
    }
    const want = Date.UTC(year, month - 1, day, hour, minute);
    const got = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    ms += want - got;
  }
  return new Date(ms);
}

function nextQuietHoursStart(now, subject, defaultTimezone = 'America/Guatemala') {
  const start = subjectQuietHoursStart(subject);
  const end = subjectQuietHoursEnd(subject);
  const timezone = subjectTimezone(subject, defaultTimezone);
  const parts = localPartsInTimezone(now, timezone);
  let year = parts.year;
  let month = parts.month;
  let day = parts.day;
  if (parts.hour >= end) {
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    year = nextDay.getUTCFullYear();
    month = nextDay.getUTCMonth() + 1;
    day = nextDay.getUTCDate();
  }
  return utcFromZonedParts(year, month, day, start, 0, timezone).toISOString();
}

function canContact(subject, channel, now = new Date(), opts = {}) {
  const defaultTimezone = cleanText(opts.defaultTimezone, 80) || 'America/Guatemala';
  if (subjectDoNotContact(subject)) return { ok: false, reason: 'do_not_contact' };
  const optOutChannels = subjectOptOutChannels(subject);
  if (optOutChannels.includes(String(channel))) return { ok: false, reason: 'opt_out' };
  const timezone = subjectTimezone(subject, defaultTimezone);
  const hour = localPartsInTimezone(now, timezone).hour;
  const quietStart = subjectQuietHoursStart(subject);
  const quietEnd = subjectQuietHoursEnd(subject);
  if (hour < quietStart || hour >= quietEnd) {
    return { ok: false, reason: 'quiet_hours', nextRetryAt: nextQuietHoursStart(now, subject, defaultTimezone) };
  }
  const maxPerWeek = Number(opts.maxPerWeek ?? 7);
  const contactsThisWeek = Number(opts.contactsThisWeek ?? 0);
  if (contactsThisWeek >= maxPerWeek) {
    return { ok: false, reason: 'frequency_cap', nextRetryAt: nextQuietHoursStart(new Date(now.getTime() + 24 * 60 * 60 * 1000), subject, defaultTimezone) };
  }
  return { ok: true };
}
