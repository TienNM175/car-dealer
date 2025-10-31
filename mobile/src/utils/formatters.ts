// ============================================
// 10. src/utils/formatters.ts
// ============================================
export const formatPrice = (price: number, currency: string = 'VND'): string => {
  if (currency === 'VND') {
    return `${(price / 1000000).toFixed(0)}M VND`;
  }
  return `$${price.toLocaleString()}`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('vi-VN');
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRange = (range: number): string => {
  return `${range} km`;
};

export const formatBattery = (capacity: number): string => {
  return `${capacity} kWh`;
};

export const formatPower = (power: number): string => {
  return `${power} kW`;
};