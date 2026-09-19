import vm from 'node:vm';

export interface MultiSportRawFeature {
  id: number;
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    name: string;
    icon_name?: string;
    recommended?: boolean;
    is_new?: boolean;
    only_virtual_card?: boolean;
  };
}

export interface MultiSportRawFacilityDetail {
  id: number;
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    name: string;
    description?: string | null;
    city?: string | null;
    street?: string | null;
    number?: string | null;
    phone?: string | null;
    email?: string | null;
    website_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    main_image?: {
      thumbnail_60_45?: string;
      thumbnail_400_300?: string;
      thumbnail_800_600?: string;
    } | null;
    galery_images?: Array<{
      thumbnail_60_45?: string;
      thumbnail_400_300?: string;
      thumbnail_800_600?: string;
      url?: string;
    }>;
    activity?: Array<{
      id: number;
      name: string;
      search_type: string;
      icon_name?: string;
      url?: string;
    }>;
    activity_summary?: string | null;
    additional_payment?: boolean;
    additional_payment_desc?: string | null;
    active_cards?: {
      visible?: Array<{
        id: number;
        name: string;
        description?: string;
        image_url?: string;
      }>;
    };
    air_condition?: boolean | null;
    parking?: boolean | null;
    unlimited_oh?: boolean | null;
    self_service?: boolean | null;
    recommended?: boolean;
    is_new?: boolean;
    only_virtual_card?: boolean;
  };
}

export class MultiSportClient {
  private static readonly AUTH_SCRIPT_URL =
    'https://cz0appsearchengine0prod.blob.core.windows.net/prod/static/js/auth.js?v=4.0';
  private static readonly BASE_URL = 'https://mapa.multisport.cz';

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  /**
   * Retrieves an authentic JWT Bearer token using MultiSport's client-side hash algorithm.
   */
  async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiresAt > now + 60_000) {
      return this.cachedToken;
    }

    const scriptRes = await fetch(MultiSportClient.AUTH_SCRIPT_URL);
    if (!scriptRes.ok) {
      throw new Error(`Failed to fetch MultiSport auth script: HTTP ${scriptRes.status}`);
    }
    const authJs = await scriptRes.text();

    let postUrl: string | null = null;
    let postPayload: Record<string, any> | null = null;

    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };

    const mockWindow = {
      jwt_token_url: `${MultiSportClient.BASE_URL}/api/v1/token/`,
      jwt_refresh_token_url: `${MultiSportClient.BASE_URL}/api/v1/token/refresh/`,
      salt: 'McTem9Lx5tY4eMKDAlZG6xBhz78cyFcwoO672QwADrhMOLAw55K2aPUNEJ92gPgw',
      offset: 0,
      isSecure: true,
      refreshTokenTimeout: 51000,
    };

    const mock$ = {
      post: (url: string, data: any) => {
        postUrl = url;
        postPayload = data;
        return { fail: () => ({}) };
      },
    };

    const context = {
      window: mockWindow,
      document: { dispatchEvent: () => {}, ready: (fn: any) => fn() },
      localStorage: mockLocalStorage,
      $: () => ({ ready: (fn: any) => fn() }),
      jQuery: mock$,
      userAuthenticatedEvent: {},
      console,
      Date,
      Array,
      setInterval: () => {},
      setTimeout: () => {},
    };
    (context.$ as any).post = mock$.post;

    vm.createContext(context);
    vm.runInContext(authJs, context);

    if (!postUrl || !postPayload) {
      throw new Error('Failed to extract token generation payload from auth.js');
    }

    const tokenRes = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: `${MultiSportClient.BASE_URL}/cs/`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(postPayload),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: HTTP ${tokenRes.status}`);
    }

    const tokenData = (await tokenRes.json()) as { access?: string };
    if (!tokenData.access) {
      throw new Error('No access token in response from MultiSport');
    }

    this.cachedToken = tokenData.access;
    this.tokenExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minute validity assumption
    return this.cachedToken!;
  }

  /**
   * Fetches the list of all facilities offering Sauna/Steam (Activity 142) in the Czech Republic.
   */
  async getSaunaFeatureList(): Promise<MultiSportRawFeature[]> {
    const token = await this.getAuthToken();
    const url = `${MultiSportClient.BASE_URL}/api/v1/facility/search/?search_type=ACTIVITY&search_type_obj_id=142`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept-Language': 'cs-CZ,cs;q=0.9',
        Referer: `${MultiSportClient.BASE_URL}/cs/`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch sauna list: HTTP ${res.status}`);
    }

    const data = (await res.json()) as { features?: MultiSportRawFeature[] };
    return data.features || [];
  }

  /**
   * Fetches detailed information for a specific facility ID with auto-retry on 401.
   */
  async getFacilityDetail(facilityId: number, retry = true): Promise<MultiSportRawFacilityDetail> {
    const token = await this.getAuthToken();
    const url = `${MultiSportClient.BASE_URL}/api/v1/facility/${facilityId}/`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept-Language': 'cs-CZ,cs;q=0.9',
        Referer: `${MultiSportClient.BASE_URL}/cs/`,
      },
    });

    if (res.status === 401 && retry) {
      // Force token refresh and retry once
      this.cachedToken = null;
      this.tokenExpiresAt = 0;
      return this.getFacilityDetail(facilityId, false);
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch facility #${facilityId}: HTTP ${res.status}`);
    }

    return (await res.json()) as MultiSportRawFacilityDetail;
  }

  /**
   * Fetches all saunas with controlled concurrency and progress callback.
   */
  async fetchAllSaunaDetails(
    concurrency = 8,
    onProgress?: (loaded: number, total: number, name: string) => void
  ): Promise<MultiSportRawFacilityDetail[]> {
    const features = await this.getSaunaFeatureList();
    const total = features.length;
    const results: MultiSportRawFacilityDetail[] = [];
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < total) {
        const index = currentIndex++;
        const feat = features[index];
        try {
          const detail = await this.getFacilityDetail(feat.id);
          results.push(detail);
          if (onProgress) {
            onProgress(results.length, total, detail.properties?.name || `ID ${feat.id}`);
          }
        } catch (err: any) {
          console.warn(`[MultiSport] Warning fetching facility #${feat.id}:`, err.message);
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);

    return results;
  }
}
