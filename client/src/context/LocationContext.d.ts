import React from 'react';
import { CzechRegionItem } from '../types';
interface UserLocation {
    lat: number;
    lon: number;
    label: string;
    regionId: string;
    isManual: boolean;
}
interface LocationContextType {
    location: UserLocation;
    isLocating: boolean;
    error: string | null;
    regions: CzechRegionItem[];
    setManualLocation: (regionId: string) => void;
    requestGeolocation: () => void;
    getDistanceTo: (targetLat: number, targetLon: number) => {
        km: number;
        formatted: string;
    } | null;
}
export declare const LocationProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useLocation: () => LocationContextType;
export {};
