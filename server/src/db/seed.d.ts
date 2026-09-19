import { DatabaseSync } from 'node:sqlite';
export declare function runSeed(customDb?: DatabaseSync): {
    success: boolean;
    venueCount: number;
    reviewCount: number;
};
