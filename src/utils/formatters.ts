// Safely convert string/number values from API to number
const toNum = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
};

// Currency formatter (default: USD)
export const formatCurrency = (value: number | string, currency = 'USD', locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(toNum(value));
};

// Date formatters
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(d);
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
};

export const formatRelativeDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const now = new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(date);
};

// Number formatters
export const formatNumber = (value: number | string): string => {
  return new Intl.NumberFormat('pt-BR').format(toNum(value));
};

export const formatPercentage = (value: number | string): string => {
  return `${toNum(value).toFixed(1)}%`;
};

// String helpers
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};
