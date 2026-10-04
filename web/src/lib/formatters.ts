export function formatCurrency(value: number | null | undefined, locale = 'en-IN'): string {
  if (value === null || value === undefined) {
    return 'Not available';
  }
  if (value === 0) {
    return '₹0';
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}
