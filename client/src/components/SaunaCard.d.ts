import React from 'react';
import { SaunaSummary } from '../types';
interface SaunaCardProps {
    sauna: SaunaSummary;
    onClick: () => void;
}
export declare const SaunaCard: React.FC<SaunaCardProps>;
export {};
