import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CZECH_REGIONS, CzechRegionItem } from '../types';
import { haversineDistance, formatDistance } from '../utils/haversine';

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
  getDistanceTo: (targetLat: number, targetLon: number) => { km: number; formatted: string } | null;
}

const STORAGE_KEY = 'saunuj_saved_location';
const DEFAULT_REGION = CZECH_REGIONS[0]; // Praha

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<UserLocation>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {
      lat: DEFAULT_REGION.lat,
      lon: DEFAULT_REGION.lon,
      label: DEFAULT_REGION.shortName,
      regionId: DEFAULT_REGION.id,
      isManual: true,
    };
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setManualLocation = useCallback((regionId: string) => {
    const region = CZECH_REGIONS.find((r) => r.id === regionId) || DEFAULT_REGION;
    const newLoc: UserLocation = {
      lat: region.lat,
      lon: region.lon,
      label: region.shortName,
      regionId: region.id,
      isManual: true,
    };
    setLocation(newLoc);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
    } catch {
      // Ignore storage error
    }
  }, []);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolokace není vaším prohlížečem podporována');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Find nearest Czech region for reference
        let nearestRegion = DEFAULT_REGION;
        let minDist = Infinity;
        CZECH_REGIONS.forEach((r) => {
          const d = haversineDistance(latitude, longitude, r.lat, r.lon);
          if (d < minDist) {
            minDist = d;
            nearestRegion = r;
          }
        });

        const newLoc: UserLocation = {
          lat: latitude,
          lon: longitude,
          label: 'Moje poloha (GPS)',
          regionId: nearestRegion.id,
          isManual: false,
        };

        setLocation(newLoc);
        setIsLocating(false);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
        } catch {
          // Ignore
        }
      },
      (err) => {
        setIsLocating(false);
        setError(`Nelze zjistit GPS polohu (${err.message}). Použito výchozí město.`);
      },
      {
        timeout: 3000,
        enableHighAccuracy: true,
        maximumAge: 60000,
      }
    );
  }, []);

  // Try automatic geolocation on first mount if not manually set before
  useEffect(() => {
    const hasSaved = localStorage.getItem(STORAGE_KEY);
    if (!hasSaved && navigator.geolocation) {
      requestGeolocation();
    }
  }, [requestGeolocation]);

  const getDistanceTo = useCallback((targetLat: number, targetLon: number) => {
    if (!location.lat || !location.lon) return null;
    const km = Math.round(haversineDistance(location.lat, location.lon, targetLat, targetLon) * 10) / 10;
    return {
      km,
      formatted: formatDistance(km),
    };
  }, [location]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLocating,
        error,
        regions: CZECH_REGIONS,
        setManualLocation,
        requestGeolocation,
        getDistanceTo,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
