export interface TimezoneOption {
  id: string;
  label: string;
  continent: string;
  timeZone: string; // IANA timezone
  offsetLabel: string;
  flag: string;
}

export const CONTINENT_TIMEZONES: TimezoneOption[] = [
  { id: 'ist', label: 'IST - India Standard Time (Asia)', continent: 'Asia', timeZone: 'Asia/Kolkata', offsetLabel: 'UTC+05:30', flag: '🇮🇳' },
  { id: 'jst', label: 'JST - Tokyo / Japan (Asia)', continent: 'Asia', timeZone: 'Asia/Tokyo', offsetLabel: 'UTC+09:00', flag: '🇯🇵' },
  { id: 'sgt', label: 'SGT - Singapore (Asia)', continent: 'Asia', timeZone: 'Asia/Singapore', offsetLabel: 'UTC+08:00', flag: '🇸🇬' },
  { id: 'gmt', label: 'BST/GMT - London (Europe)', continent: 'Europe', timeZone: 'Europe/London', offsetLabel: 'UTC+01:00', flag: '🇬🇧' },
  { id: 'cet', label: 'CET - Paris / Berlin (Europe)', continent: 'Europe', timeZone: 'Europe/Paris', offsetLabel: 'UTC+02:00', flag: '🇪🇺' },
  { id: 'est', label: 'EDT/EST - New York (N. America)', continent: 'North America', timeZone: 'America/New_York', offsetLabel: 'UTC-04:00', flag: '🇺🇸' },
  { id: 'pst', label: 'PDT/PST - San Francisco (N. America)', continent: 'North America', timeZone: 'America/Los_Angeles', offsetLabel: 'UTC-07:00', flag: '🇺🇸' },
  { id: 'brt', label: 'BRT - São Paulo (S. America)', continent: 'South America', timeZone: 'America/Sao_Paulo', offsetLabel: 'UTC-03:00', flag: '🇧🇷' },
  { id: 'eat', label: 'EAT - Nairobi (Africa)', continent: 'Africa', timeZone: 'Africa/Nairobi', offsetLabel: 'UTC+03:00', flag: '🇰🇪' },
  { id: 'aest', label: 'AEST - Sydney (Australia)', continent: 'Australia', timeZone: 'Australia/Sydney', offsetLabel: 'UTC+10:00', flag: '🇦🇺' },
  { id: 'antarctica', label: 'UTC+12 - McMurdo (Antarctica)', continent: 'Antarctica', timeZone: 'Antarctica/McMurdo', offsetLabel: 'UTC+12:00', flag: '🇦🇶' },
];

/**
 * Converts an IST time string (e.g. "09:00 AM") on a date (e.g. "2026-08-10")
 * to a formatted time in the target IANA timezone.
 */
export function convertIstTimeToTimezone(dateStr: string, timeStr: string, targetTz: string): string {
  try {
    // Parse "09:00 AM" into 24h format
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return timeStr;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const isoString = `${dateStr}T${pad(hour)}:${pad(minute)}:00+05:30`; // IST is UTC+5:30

    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) return timeStr;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return formatter.format(dateObj);
  } catch (err) {
    console.error('Timezone conversion error:', err);
    return timeStr;
  }
}

/**
 * Converts a slot range string in IST (e.g. "09:00 AM - 10:00 AM")
 * into target timezone string (e.g. "11:30 PM - 12:30 AM").
 */
export function convertSlotRangeToTimezone(dateStr: string, slotLabel: string, targetTz: string): string {
  if (targetTz === 'Asia/Kolkata') return slotLabel;

  const parts = slotLabel.split('-').map(p => p.trim());
  if (parts.length !== 2) return slotLabel;

  const startConverted = convertIstTimeToTimezone(dateStr, parts[0], targetTz);
  const endConverted = convertIstTimeToTimezone(dateStr, parts[1], targetTz);

  return `${startConverted} - ${endConverted}`;
}
