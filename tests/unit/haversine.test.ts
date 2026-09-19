import { describe, it, expect } from 'vitest';
import { haversineDistance, formatDistance, isWithinRadius } from '../setup';

describe('Unit: Haversine Geolocation Engine', () => {
  it('TEST-GEO-01: calculates Prague-Brno distance with high accuracy (186.10 km ± 0.5 km)', () => {
    const prague = { lat: 50.0878, lon: 14.4205 };
    const brno = { lat: 49.1951, lon: 16.6068 };

    const distance = haversineDistance(prague.lat, prague.lon, brno.lat, brno.lon);
    expect(distance).toBeGreaterThan(185.5);
    expect(distance).toBeLessThan(186.7);
    expect(distance.toFixed(2)).toBe('186.10');
  });

  it('BND-02: handles exact zero distance without division by zero or NaN', () => {
    const coords = { lat: 50.0531, lon: 14.4172 };
    const distance = haversineDistance(coords.lat, coords.lon, coords.lat, coords.lon);

    expect(distance).toBe(0);
    expect(formatDistance(distance)).toBe('0 m');
  });

  it('BND-03: formats micro-distances (< 1 km) in meters and larger distances in kilometers', () => {
    expect(formatDistance(0.05)).toBe('50 m');
    expect(formatDistance(0.45)).toBe('450 m');
    expect(formatDistance(0.8)).toBe('800 m');
    expect(formatDistance(0.999)).toBe('999 m');

    expect(formatDistance(1.2)).toBe('1.2 km');
    expect(formatDistance(3.87)).toBe('3.9 km');
    expect(formatDistance(15.4)).toBe('15 km');
    expect(formatDistance(186.1)).toBe('186 km');
  });

  it('BND-04: handles antipodal and extreme foreign GPS coordinates safely without overflow', () => {
    const prague = { lat: 50.0878, lon: 14.4205 };
    const sydney = { lat: -33.8688, lon: 151.2093 };

    const distance = haversineDistance(prague.lat, prague.lon, sydney.lat, sydney.lon);
    expect(Number.isFinite(distance)).toBe(true);
    expect(distance).toBeGreaterThan(15000);
    expect(distance).toBeLessThan(17000);

    const northPole = haversineDistance(prague.lat, prague.lon, 90, 0);
    expect(Number.isFinite(northPole)).toBe(true);
    expect(northPole).toBeGreaterThan(4000);
  });

  it('BND-05: verifies search radius boundaries strictly (dist <= radius)', () => {
    const origin = { lat: 50.0, lon: 14.0 };
    // Approx 1 deg lat = 111 km
    // 0.0899 degrees lat is approximately 10.0 km
    const target10km = { lat: 50.08993, lon: 14.0 };
    const target10_1km = { lat: 50.091, lon: 14.0 };

    const dist1 = haversineDistance(origin.lat, origin.lon, target10km.lat, target10km.lon);
    const dist2 = haversineDistance(origin.lat, origin.lon, target10_1km.lat, target10_1km.lon);

    expect(dist1).toBeLessThanOrEqual(10.01);
    expect(dist2).toBeGreaterThan(10.05);

    expect(isWithinRadius(origin.lat, origin.lon, target10km.lat, target10km.lon, 10.01)).toBe(true);
    expect(isWithinRadius(origin.lat, origin.lon, target10_1km.lat, target10_1km.lon, 10.0)).toBe(false);
  });
});
