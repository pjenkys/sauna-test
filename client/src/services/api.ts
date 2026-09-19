import type {
  SaunaSummary,
  SaunaDetail,
  MapMarker,
  User,
  Review,
  UserListsState,
  SaunaCeremony,
  AffiliatePartnerProduct,
} from '../types';

const API_BASE = '/api';

export interface GetSaunasParams {
  q?: string;
  category?: string;
  benefit_type?: string;
  time_limit?: number;
  cooling?: string;
  sauna_type?: string;
  nudity_policy?: string;
  region_id?: string;
  city_id?: string;
  lat?: number;
  lon?: number;
  radius_km?: number;
  sort?: string;
  has_ceremonial_hall?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetSaunasResponse {
  success: boolean;
  data: SaunaSummary[];
  meta: {
    count: number;
    suggestedRelaxations?: string[];
  };
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  error?: string;
}

export interface ReviewInput {
  venue_id: string;
  overall_rating: number;
  cleanliness?: number;
  heat_quality?: number;
  cooling_quality?: number;
  staff_ceremony?: number;
  price_value?: number;
  title?: string;
  content?: string;
  tips?: string;
  recommended_time?: string;
  visit_date?: string;
}

export interface ClaimInput {
  venue_id: string;
  business_name: string;
  ico: string;
  applicant_name: string;
  applicant_role: string;
  business_email: string;
  phone: string;
  billing_address?: string;
}

export interface SuggestionInput {
  venue_name: string;
  category: string;
  street_address: string;
  city: string;
  multisport_status?: string;
  cooling_options?: string[];
  description?: string;
  submitter_email: string;
  submitter_name?: string;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('saunuj_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error || json.message || `Chyba serveru (${response.status})`);
  }

  return json;
}

export const api = {
  // 1. Saunas
  async getSaunas(params: GetSaunasParams = {}): Promise<GetSaunasResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const qStr = query.toString();
    return request<GetSaunasResponse>(`/saunas${qStr ? `?${qStr}` : ''}`);
  },

  async getSaunaDetail(slugOrId: string): Promise<{ success: boolean; data: SaunaDetail }> {
    return request<{ success: boolean; data: SaunaDetail }>(`/saunas/${encodeURIComponent(slugOrId)}`);
  },

  async getRecommendations(lat: number, lon: number, limit = 3): Promise<{ success: boolean; data: SaunaSummary[] }> {
    return request<{ success: boolean; data: SaunaSummary[] }>(`/saunas/recommendations?lat=${lat}&lon=${lon}&limit=${limit}`);
  },

  async getMapMarkers(): Promise<{ success: boolean; data: MapMarker[] }> {
    return request<{ success: boolean; data: MapMarker[] }>('/saunas/map-markers');
  },

  // 2. Auth
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(data: { email: string; password: string; display_name: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>('/auth/me');
  },

  // 3. Reviews
  async getReviews(venueId: string): Promise<{ success: boolean; data: Review[] }> {
    return request<{ success: boolean; data: Review[] }>(`/reviews/${encodeURIComponent(venueId)}`);
  },

  async createReview(data: ReviewInput): Promise<{ success: boolean; review: Review }> {
    return request<{ success: boolean; review: Review }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async voteReviewHelpful(reviewId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/reviews/${encodeURIComponent(reviewId)}/helpful`, {
      method: 'POST',
    });
  },

  // 4. Saved Lists ("Oblíbené", "Chci navštívit", "Navštíveno")
  async getUserLists(): Promise<{ success: boolean; data: UserListsState }> {
    return request<{ success: boolean; data: UserListsState }>('/users/me/lists');
  },

  async addToList(data: {
    venue_id: string;
    list_type: 'favorite' | 'want_to_visit' | 'visited';
    visited_at?: string;
    personal_notes?: string;
  }): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/users/me/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeFromList(venueId: string, listType = 'favorite'): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/users/me/lists/${encodeURIComponent(venueId)}?type=${listType}`, {
      method: 'DELETE',
    });
  },

  // 5. B2B Claims
  async submitClaim(data: ClaimInput): Promise<{ success: boolean; claim_id: string }> {
    return request<{ success: boolean; claim_id: string }>('/claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 6. Community Proposals
  async submitSuggestion(data: SuggestionInput): Promise<{ success: boolean; suggestion_id: string }> {
    return request<{ success: boolean; suggestion_id: string }>('/suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 7. Ceremonies
  async getCeremonies(params: { venue_id?: string; category?: string; day_of_week?: number } = {}): Promise<{ success: boolean; data: SaunaCeremony[] }> {
    const query = new URLSearchParams();
    if (params.venue_id) query.append('venue_id', params.venue_id);
    if (params.category) query.append('category', params.category);
    if (params.day_of_week !== undefined) query.append('day_of_week', String(params.day_of_week));
    const qStr = query.toString();
    return request<{ success: boolean; data: SaunaCeremony[] }>(`/ceremonies${qStr ? `?${qStr}` : ''}`);
  },

  // 8. Affiliates & Click Tracking
  async getAffiliateProducts(): Promise<{ success: boolean; data: AffiliatePartnerProduct[] }> {
    return request<{ success: boolean; data: AffiliatePartnerProduct[] }>('/affiliate-products');
  },

  async trackReferralClick(data: {
    venue_id?: string;
    affiliate_product_id?: string;
    click_type: 'venue_booking_url' | 'venue_website' | 'affiliate_product';
    destination_url?: string;
  }): Promise<void> {
    try {
      await fetch(`${API_BASE}/referrals/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Non-blocking analytics
    }
  },
};
