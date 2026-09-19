/**
 * MultiSport Fee & Discount Calculation Engine
 */

export interface OvertimeFeeParams {
  freeMinutes: number;
  blockMinutes: number;
  blockPrice: number;
  stayDuration: number;
}

export function calculateOvertimeFee(params: OvertimeFeeParams): number {
  const { freeMinutes, blockMinutes, blockPrice, stayDuration } = params;
  if (stayDuration <= freeMinutes) return 0;
  const overtimeMinutes = stayDuration - freeMinutes;
  const blocks = Math.ceil(overtimeMinutes / blockMinutes);
  return blocks * blockPrice;
}

export interface MultisportFinalPriceParams {
  basePrice: number;
  benefitType: string;
  discountCzk?: number | null;
  discountPercent?: number | null;
  surchargeCzk?: number | null;
  stayDuration?: number;
  freeMinutes?: number;
  blockMinutes?: number;
  blockPrice?: number;
}

export interface MultisportFinalPriceResult {
  finalPrice: number;
  discountApplied: number;
  surchargeApplied: number;
  overtimeFee: number;
}

export function calculateMultisportFinalPrice(
  params: MultisportFinalPriceParams
): MultisportFinalPriceResult {
  const {
    basePrice,
    benefitType,
    discountCzk,
    discountPercent,
    surchargeCzk,
    stayDuration,
    freeMinutes,
    blockMinutes,
    blockPrice,
  } = params;

  let finalPrice = basePrice;
  let discountApplied = 0;
  let surchargeApplied = 0;
  let overtimeFee = 0;

  if (benefitType === 'free_unlimited') {
    finalPrice = 0;
    discountApplied = basePrice;
  } else if (benefitType === 'free_time_limited') {
    finalPrice = 0;
    discountApplied = basePrice;
    if (stayDuration && freeMinutes && blockMinutes && blockPrice) {
      overtimeFee = calculateOvertimeFee({ freeMinutes, blockMinutes, blockPrice, stayDuration });
      finalPrice += overtimeFee;
    }
  } else if (benefitType === 'entry_discount') {
    if (discountCzk) {
      discountApplied = discountCzk;
      finalPrice = Math.max(0, basePrice - discountCzk);
    } else if (discountPercent) {
      discountApplied = Math.round((basePrice * discountPercent) / 100);
      finalPrice = Math.max(0, basePrice - discountApplied);
    }
  } else if (benefitType === 'surcharge_entry') {
    surchargeApplied = surchargeCzk ?? 0;
    finalPrice = surchargeApplied;
    if (stayDuration && freeMinutes && blockMinutes && blockPrice) {
      overtimeFee = calculateOvertimeFee({ freeMinutes, blockMinutes, blockPrice, stayDuration });
      finalPrice += overtimeFee;
    }
  }

  return { finalPrice, discountApplied, surchargeApplied, overtimeFee };
}
