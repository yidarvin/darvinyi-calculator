export function isLuhnValid(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = +digits[i];
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function isPlausibleExpiry(mmYY: string): boolean {
  const m = mmYY.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
  if (!m) return false;
  const month = +m[1]; let year = +m[2];
  if (year < 100) year += 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return new Date(year, month, 0) >= now;
}

export function hashLast4(num: string): string {
  // simple stable hash — never use for security
  const last4 = num.replace(/\D/g, '').slice(-4);
  let h = 0;
  for (const c of last4) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(8, '0');
}
