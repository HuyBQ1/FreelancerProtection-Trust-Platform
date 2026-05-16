export const APP_CURRENCY = 'VND';

export function parseMoneyAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = `${value || ''}`.replace(/[^0-9]/g, '');
  const parsed = Number.parseInt(normalized, 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(amount) {
  const numericAmount = Number(amount) || 0;
  const roundedAmount = Math.round(numericAmount);

  return `${roundedAmount.toLocaleString('vi-VN')} ${APP_CURRENCY}`;
}

export function normalizeMoneyDisplay(value) {
  const amount = parseMoneyAmount(value);

  return formatMoney(amount);
}
