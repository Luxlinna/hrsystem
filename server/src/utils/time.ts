export function toMinutes(timeVal: string | Date | null | undefined): number {
  if (!timeVal) return 0;
  if (typeof timeVal === 'string') {
    const clean = timeVal.includes('T') ? timeVal.split('T')[1].slice(0, 8) : timeVal.slice(0, 8);
    const [h, m] = clean.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  if (timeVal instanceof Date) {
    return timeVal.getUTCHours() * 60 + timeVal.getUTCMinutes();
  }
  return 0;
}

export function formatTimeStr(timeVal: string | Date | null | undefined): string {
  if (!timeVal) return '00:00:00';
  if (typeof timeVal === 'string') {
    if (timeVal.includes('T')) return timeVal.split('T')[1].slice(0, 8);
    return timeVal.slice(0, 8);
  }
  if (timeVal instanceof Date) {
    const h = String(timeVal.getUTCHours()).padStart(2, '0');
    const m = String(timeVal.getUTCMinutes()).padStart(2, '0');
    const s = String(timeVal.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return '00:00:00';
}

export function timeStrToDate(timeStr: string): Date {
  return new Date(`1970-01-01T${timeStr.slice(0, 8)}Z`);
}
