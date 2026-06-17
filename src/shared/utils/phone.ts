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

/** Strip to at most 10 local digits (strips leading 7 or 8). */
export function parsePhoneDigits(value: string): string {
  const raw = value.replace(/\D/g, '');
  const local = raw.startsWith('7') || raw.startsWith('8') ? raw.slice(1) : raw;
  return local.slice(0, 10);
}

/** Format 10 local digits → "+7 (929) 123-45-67" display string. */
export function formatPhoneDigits(digits: string): string {
  let r = '+7 (';
  r += digits.slice(0, 3);
  if (digits.length <= 3) return r;
  r += ') ' + digits.slice(3, 6);
  if (digits.length <= 6) return r;
  r += '-' + digits.slice(6, 8);
  if (digits.length <= 8) return r;
  r += '-' + digits.slice(8, 10);
  return r;
}

/** 10 local digits → E.164 for storage, e.g. "+79261234567". */
export function digitsToE164(digits: string): string {
  return `+7${digits}`;
}

export function isValidDigits(digits: string): boolean {
  return digits.length === 10;
}
