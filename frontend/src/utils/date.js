import { format, isValid } from 'date-fns';

export function fmtDate(value, fmt = 'd MMM yyyy') {
  if (!value) return '—';
  const d = new Date(value);
  return isValid(d) ? format(d, fmt) : '—';
}
