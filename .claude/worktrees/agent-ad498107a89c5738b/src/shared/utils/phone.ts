export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function phoneVariants(raw: string): string[] {
  const digits = normalizePhone(raw);
  const national = digits.slice(-10);
  return [`+7${national}`, `7${national}`, `8${national}`, national];
}

export function isValidRuPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return /^(7\d{10}|8\d{10}|\d{10})$/.test(digits);
}
