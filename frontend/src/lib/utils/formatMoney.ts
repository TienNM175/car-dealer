// frontend/src/lib/utils/formatMoney.ts

export const formatMoney = (
  amount: number,
  currency: string = "VND"
): string => {
  if (amount === 0) return "0 VNĐ";

  // Simple format với dấu chấm ngăn cách hàng nghìn
  const numStr = amount.toString();
  const parts = [];

  for (let i = numStr.length; i > 0; i -= 3) {
    parts.unshift(numStr.slice(Math.max(0, i - 3), i));
  }

  const formatted = parts.join(".");
  return `${formatted} VNĐ`;
};

export const formatMoneyDetailed = (
  amount: number,
  currency: string = "VND"
): string => {
  // Full format with thousand separators
  return `${amount.toLocaleString("vi-VN")} VNĐ`;
};

export const formatMoneyShort = (
  amount: number,
  currency: string = "VND"
): string => {
  // Very short format for grid view: 2.082.800.000 VNĐ -> 2.082.800.000 VNĐ (rút gọn số)
  if (amount >= 1000000000) {
    // Tỷ: 2.082.800.000 VNĐ -> 2.082.800.000 VNĐ (chỉ hiển thị 3 chữ số đầu của triệu)
    const billions = Math.floor(amount / 1000000000);
    const remainder = Math.floor((amount % 1000000000) / 1000000);
    if (remainder > 0) {
      return `${billions}.${remainder.toString().padStart(3, "0")}.000.000 VNĐ`;
    }
    return `${billions}.000.000.000 VNĐ`;
  } else if (amount >= 1000000) {
    // Triệu: 690.000.000 VNĐ -> 690.000.000 VNĐ
    const millions = Math.floor(amount / 1000000);
    return `${millions}.000.000 VNĐ`;
  } else {
    // Nghìn: 150.000 VNĐ -> 150.000 VNĐ
    const thousands = Math.floor(amount / 1000);
    return `${thousands}.000 VNĐ`;
  }
};

export const formatMoneyCompact = (
  amount: number,
  currency: string = "VND"
): string => {
  // Compact format for tight spaces: 2.08B VNĐ
  const formatted = amount.toLocaleString("vi-VN");

  // If too long, use short format
  if (formatted.length > 12) {
    return formatMoneyShort(amount, currency);
  }

  return `${formatted} VNĐ`;
};
