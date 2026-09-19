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
export declare function validateIco(ico: string | number | null | undefined): boolean;
