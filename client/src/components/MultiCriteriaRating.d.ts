import React from 'react';
interface MultiCriteriaRatingProps {
    overall: number;
    cleanliness: number;
    heatSteam: number;
    cooling: number;
    staffCeremonies: number;
    value: number;
    reviewCount: number;
    className?: string;
}
export declare const MultiCriteriaRating: React.FC<MultiCriteriaRatingProps>;
export {};
