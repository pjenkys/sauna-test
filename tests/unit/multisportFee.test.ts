import { describe, it, expect } from 'vitest';
import { calculateOvertimeFee, calculateMultisportFinalPrice } from '../setup';

describe('Unit: MultiSport Fee & Discount Calculation Engine', () => {
  it('TEST-MS-06: calculates overtime surcharge in discrete 15-minute blocks accurately', () => {
    // 90 min free, 45 min overtime = 3 * 15m blocks @ 25 CZK
    const fee = calculateOvertimeFee({
      freeMinutes: 90,
      blockMinutes: 15,
      blockPrice: 25,
      stayDuration: 135,
    });
    expect(fee).toBe(75);
  });

  it('calculates partial overtime by rounding up to the next block (ceiling behavior)', () => {
    // 90 min free, 10 min overtime -> 1 block of 15m @ 25 CZK = 25 CZK
    const fee1 = calculateOvertimeFee({
      freeMinutes: 90,
      blockMinutes: 15,
      blockPrice: 25,
      stayDuration: 100,
    });
    expect(fee1).toBe(25);

    // 90 min free, 16 min overtime -> 2 blocks of 15m @ 25 CZK = 50 CZK
    const fee2 = calculateOvertimeFee({
      freeMinutes: 90,
      blockMinutes: 15,
      blockPrice: 25,
      stayDuration: 106,
    });
    expect(fee2).toBe(50);
  });

  it('returns 0 fee when stay is strictly within or exactly at the time limit', () => {
    const feeUnder = calculateOvertimeFee({
      freeMinutes: 90,
      blockMinutes: 15,
      blockPrice: 25,
      stayDuration: 85,
    });
    expect(feeUnder).toBe(0);

    const feeExact = calculateOvertimeFee({
      freeMinutes: 90,
      blockMinutes: 15,
      blockPrice: 25,
      stayDuration: 90,
    });
    expect(feeExact).toBe(0);
  });

  it('calculates 100% free unlimited entry with full discount', () => {
    const result = calculateMultisportFinalPrice({
      basePrice: 420,
      benefitType: 'free_unlimited',
    });
    expect(result.finalPrice).toBe(0);
    expect(result.discountApplied).toBe(420);
    expect(result.overtimeFee).toBe(0);
  });

  it('calculates fixed CZK entry discount correctly (e.g. -100 Kč or -120 Kč)', () => {
    const result = calculateMultisportFinalPrice({
      basePrice: 450,
      benefitType: 'entry_discount',
      discountCzk: 100,
    });
    expect(result.finalPrice).toBe(350);
    expect(result.discountApplied).toBe(100);
    expect(result.surchargeApplied).toBe(0);
  });

  it('calculates percentage entry discount correctly', () => {
    const result = calculateMultisportFinalPrice({
      basePrice: 400,
      benefitType: 'entry_discount',
      discountPercent: 20,
    });
    expect(result.finalPrice).toBe(320);
    expect(result.discountApplied).toBe(80);
  });

  it('calculates required entry surcharge and adds overtime when exceeded', () => {
    const result = calculateMultisportFinalPrice({
      basePrice: 590,
      benefitType: 'surcharge_entry',
      surchargeCzk: 250,
      stayDuration: 120,
      freeMinutes: 90,
      blockMinutes: 15,
      blockPrice: 30,
    });
    // 30 min overtime = 2 blocks * 30 = 60 Kč
    // Total = 250 copay + 60 overtime = 310 Kč
    expect(result.surchargeApplied).toBe(250);
    expect(result.overtimeFee).toBe(60);
    expect(result.finalPrice).toBe(310);
  });
});
