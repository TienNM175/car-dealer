// ============================================
// 11. src/utils/validation.ts
// ============================================
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^(0|\+84)[0-9]{9,10}$/;
  return re.test(phone.replace(/\s/g, ''));
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const validateDate = (date: Date): boolean => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return date >= now;
};