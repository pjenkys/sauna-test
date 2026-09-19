import React from 'react';
import { MapMarker } from '../types';
interface SaunaMapProps {
    markers: MapMarker[];
    center?: [number, number];
    zoom?: number;
    onSelectSauna: (slug: string) => void;
    selectedSlug?: string;
    className?: string;
}
export declare const SaunaMap: React.FC<SaunaMapProps>;
export {};
