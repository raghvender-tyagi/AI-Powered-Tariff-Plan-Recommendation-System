export const currency = (value, opts = {}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: opts.decimals ?? 0,
  }).format(value);
};

export const number = (value, decimals = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: decimals }).format(value);
};

export const percent = (value, decimals = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value).toFixed(decimals)}%`;
};

export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const round = (value, decimals = 0) => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};

export const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

export const formatDate = (dateInput) =>
  new Date(dateInput).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
