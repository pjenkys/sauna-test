import { describe, it, expect } from 'vitest';
import { validateIco } from '../setup';

describe('Unit: Czech 8-digit IČO Modulo-11 Validator', () => {
  it('TEST-CLM-02: verifies valid real-world Czech corporate IČO numbers', () => {
    // Verified authentic Czech entities
    expect(validateIco('27082440')).toBe(true); // Alza.cz a.s. (special rem=1 check digit=0 rule)
    expect(validateIco('00006947')).toBe(true); // Česká pošta s.p.
    expect(validateIco('45274649')).toBe(true); // ČEZ a.s.
    expect(validateIco('26168685')).toBe(true); // Seznam.cz a.s.
    expect(validateIco('28471920')).toBe(true); // Valid Modulo-11 8-digit IČO
  });

  it('accepts valid numeric representation of IČO', () => {
    expect(validateIco(27082440)).toBe(true);
    expect(validateIco(45274649)).toBe(true);
    expect(validateIco(26168685)).toBe(true);
  });

  it('BND-13: rejects valid-length 8-digit numbers with invalid Modulo-11 checksum', () => {
    expect(validateIco('12345678')).toBe(false);
    expect(validateIco('28471923')).toBe(false); // Check digit mismatch (expected 0, got 3)
    expect(validateIco('00000000')).toBe(false);
    expect(validateIco('99999999')).toBe(false);
  });

  it('rejects malformed, non-8-digit, non-numeric, or null/empty inputs', () => {
    expect(validateIco('12345')).toBe(false);
    expect(validateIco('123456789')).toBe(false);
    expect(validateIco('abcdefgh')).toBe(false);
    expect(validateIco('2847192A')).toBe(false);
    expect(validateIco('')).toBe(false);
    expect(validateIco('   ')).toBe(false);
    expect(validateIco(null)).toBe(false);
    expect(validateIco(undefined)).toBe(false);
  });
});
