export const normalizeIndonesianPhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const noPlus = trimmed.startsWith('+') ? trimmed.slice(1) : trimmed;
  const digits = noPlus.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
};

export const isIntegerAmount = (amount: number) => Number.isFinite(amount) && Math.round(amount) === amount;

