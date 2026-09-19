/**
 * Czech 8-digit IČO (Identifikační číslo osoby) Modulo-11 algorithmic validator.
 * 
 * Algorithm:
 * Weights: [8, 7, 6, 5, 4, 3, 2]
 * Sum = sum(d[i] * w[i]) for i in 0..6
 * Remainder = Sum % 11
 * If Remainder === 0 -> Check Digit = 1
 * If Remainder === 1 -> Check Digit = 0
 * Else -> Check Digit = 11 - Remainder
 * Check Digit must equal d[7].
 */
export function validateIco(ico: string | number | null | undefined): boolean {
  if (ico == null) return false;

  const str = String(ico).trim();
  // Must be exactly 8 numeric digits
  if (!/^\d{8}$/.test(str)) {
    return false;
  }

  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += Number(str[i]) * weights[i];
  }

  const remainder = sum % 11;
  let checkDigit = 0;
  if (remainder === 0) {
    checkDigit = 1;
  } else if (remainder === 1) {
    checkDigit = 0;
  } else {
    checkDigit = 11 - remainder;
  }

  return Number(str[7]) === checkDigit;
}
