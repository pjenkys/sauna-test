import type { SaunaDetail, SaunaSummary, MapMarker, SaunaCeremony } from '../types';
import { haversineDistanceKm } from '../utils/haversine';
import type { GetSaunasParams, GetSaunasResponse } from './api';

let cachedSaunas: SaunaDetail[] | null = null;
let cachedCeremonies: SaunaCeremony[] | null = null;

async function loadStaticSaunas(): Promise<SaunaDetail[]> {
  if (cachedSaunas) return cachedSaunas;
  try {
    const basePath = (import.meta as any).env?.BASE_URL || './';
    const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const res = await fetch(`${cleanBase}data/saunas.json`);
    if (res.ok) {
      cachedSaunas = await res.json();
      return cachedSaunas || [];
    }
  } catch {}
  try {
    const res = await fetch('./data/saunas.json');
    if (res.ok) {
      cachedSaunas = await res.json();
      return cachedSaunas || [];
    }
  } catch {}
  return [];
}

export async function getStaticSaunas(params: GetSaunasParams): Promise<GetSaunasResponse> {
  const saunas = await loadStaticSaunas();
  let filtered = [...saunas];

  if (params.q) {
    const qLower = params.q.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(qLower) ||
        (s.address_city && s.address_city.toLowerCase().includes(qLower)) ||
        (s.short_description && s.short_description.toLowerCase().includes(qLower))
    );
  }

  if (params.category) {
    filtered = filtered.filter((s) => s.category === params.category);
  }

  if (params.benefit_type) {
    filtered = filtered.filter((s) => s.multisport?.benefit_type === params.benefit_type);
  }

  if (params.time_limit !== undefined && params.time_limit !== null) {
    filtered = filtered.filter(
      (s) => (s.multisport?.time_limit_minutes || 0) >= Number(params.time_limit)
    );
  }

  if (params.region_id) {
    filtered = filtered.filter((s) => s.region_id === params.region_id);
  }

  if (params.has_ceremonial_hall) {
    filtered = filtered.filter((s) => s.has_ceremonial_hall);
  }

  if (params.cooling) {
    if (params.cooling === 'plunge_pool') filtered = filtered.filter((s) => s.has_plunge_pool);
    else if (params.cooling === 'natural_water') filtered = filtered.filter((s) => s.has_natural_water);
    else if (params.cooling === 'shower')
      filtered = filtered.filter((s) => s.has_bucket_shower || s.has_experience_showers);
  }

  if (params.sauna_type) {
    if (params.sauna_type === 'steam') filtered = filtered.filter((s) => s.has_steam_bath);
    else if (params.sauna_type === 'bio') filtered = filtered.filter((s) => s.has_herbal_sauna);
  }

  // Proximity & Sorting
  if (params.sort === 'rating') {
    filtered.sort((a, b) => b.rating_overall - a.rating_overall);
  } else if (params.sort === 'distance' && params.lat && params.lon) {
    filtered.forEach((s) => {
      s.distance_km = haversineDistanceKm(params.lat!, params.lon!, s.latitude, s.longitude) || 9999;
    });
    filtered.sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999));
  } else if (params.sort === 'reviews') {
    filtered.sort((a, b) => b.review_count - a.review_count);
  } else {
    // Default: recommended / partners first
    filtered.sort((a, b) => {
      if (a.is_promoted && !b.is_promoted) return -1;
      if (!a.is_promoted && b.is_promoted) return 1;
      return b.rating_overall - a.rating_overall;
    });
  }

  return {
    success: true,
    data: filtered as unknown as SaunaSummary[],
    meta: {
      count: filtered.length,
    },
  };
}

export async function getStaticSaunaDetail(
  slugOrId: string
): Promise<{ success: boolean; data: SaunaDetail }> {
  const saunas = await loadStaticSaunas();
  const found = saunas.find((s) => s.slug === slugOrId || s.id === slugOrId);
  if (found) {
    return { success: true, data: found };
  }
  throw new Error('Sauna nenalezena');
}

export async function getStaticCeremonies(): Promise<{ success: boolean; data: SaunaCeremony[] }> {
  if (cachedCeremonies) return { success: true, data: cachedCeremonies };
  try {
    const basePath = (import.meta as any).env?.BASE_URL || './';
    const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const res = await fetch(`${cleanBase}data/ceremonies.json`);
    if (res.ok) {
      cachedCeremonies = await res.json();
      return { success: true, data: cachedCeremonies || [] };
    }
  } catch {}
  return { success: true, data: [] };
}
