export function digitsOnly(value: string): string {
  return value.replaceAll(/\D/g, '');
}

// Store phone in DB as local Indonesian number without 0/62 prefix.
export function normalizePhoneForDb(phone: string): string {
  let cleaned = digitsOnly(phone);
  if (cleaned.startsWith('0062')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('62')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

export function toMsisdn(phone: string, countryCode: string = '+62'): string {
  const normalizedPhone = normalizePhoneForDb(phone);
  const countryCodeDigits = countryCode.replace('+', '');
  return `${countryCodeDigits}${normalizedPhone}`;
}

export function isValidLocalPhoneLength(
  localPhone: string,
  minLength: number = 9,
  maxLength: number = 13
): boolean {
  return localPhone.length >= minLength && localPhone.length <= maxLength;
}
