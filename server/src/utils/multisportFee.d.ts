/**
 * MultiSport Fee & Discount Calculation Engine
 */
export interface OvertimeFeeParams {
    freeMinutes: number;
    blockMinutes: number;
    blockPrice: number;
    stayDuration: number;
}
export declare function calculateOvertimeFee(params: OvertimeFeeParams): number;
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
export declare function calculateMultisportFinalPrice(params: MultisportFinalPriceParams): MultisportFinalPriceResult;
