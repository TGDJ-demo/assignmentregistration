export function generateAvailableDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  let current = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const aug1 = new Date(2026, 7, 1);   // Aug 1, 2026
  const aug31 = new Date(2026, 7, 31); // Aug 31, 2026

  // If present day is before August 1, 2026 or after August 31, 2026, start at Aug 1, 2026
  if (current < aug1 || current > aug31) {
    current = aug1;
  }

  while (current <= aug31) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
