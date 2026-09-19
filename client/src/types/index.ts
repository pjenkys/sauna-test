/**
 * Client Domain Types & Constants
 * Fully synchronized with shared/types.ts and shared/constants.ts
 */

export const VENUE_CATEGORIES = {
  PUBLIC: 'public',
  WELLNESS_CEREMONIAL: 'wellness_ceremonial',
  PRIVATE: 'private',
  HOTEL_MOUNTAIN: 'hotel_mountain',
} as const;

export type VenueCategoryCode = typeof VENUE_CATEGORIES[keyof typeof VENUE_CATEGORIES];

export const VENUE_CATEGORY_LABELS: Record<VenueCategoryCode, { cz: string; en: string; description: string; color: string; badgeBg: string }> = {
  [VENUE_CATEGORIES.PUBLIC]: {
    cz: 'Veřejné sauny a bazény',
    en: 'Public Saunas & Municipal Pools',
    description: 'Běžně přístupná veřejná saunová centra a bazénové komplexy s příznivou cenou.',
    color: '#0ea5e9',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  [VENUE_CATEGORIES.WELLNESS_CEREMONIAL]: {
    cz: 'Zážitková a ceremoniální wellness',
    en: 'Experiential & Ceremonial Wellness',
    description: 'Prémiová saunová centra se saunovými divadly, mistry ručníku a bohatým programem rituálů.',
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  [VENUE_CATEGORIES.PRIVATE]: {
    cz: 'Soukromé a privátní sauny',
    en: 'Private Rental & Intimate Saunas',
    description: 'Diskrétní zóny k pronájmu pro páry či uzavřené skupiny s maximálním soukromím.',
    color: '#a855f7',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  [VENUE_CATEGORIES.HOTEL_MOUNTAIN]: {
    cz: 'Hotelové a horské sauny',
    en: 'Hotel & Mountain Resort Saunas',
    description: 'Wellness centra v horských střediscích a boutique hotelech s panoramatickými výhledy.',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
};

export const MULTISPORT_BENEFIT_TYPES = {
  FREE_UNLIMITED: 'free_unlimited',
  FREE_TIME_LIMITED: 'free_time_limited',
  ENTRY_DISCOUNT: 'entry_discount',
  SURCHARGE_ENTRY: 'surcharge_entry',
  NOT_ACCEPTED: 'not_accepted',
} as const;

export type MultisportBenefitTypeCode = typeof MULTISPORT_BENEFIT_TYPES[keyof typeof MULTISPORT_BENEFIT_TYPES];

export const MULTISPORT_BENEFIT_LABELS: Record<MultisportBenefitTypeCode, { cz: string; en: string; badge: string; pillClass: string }> = {
  [MULTISPORT_BENEFIT_TYPES.FREE_UNLIMITED]: {
    cz: '100% vstup zdarma (neomezený čas)',
    en: '100% Free Unlimited Entry',
    badge: 'Zdarma neomezeně',
    pillClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  [MULTISPORT_BENEFIT_TYPES.FREE_TIME_LIMITED]: {
    cz: 'Časově omezený vstup zdarma',
    en: 'Time-limited Free Entry',
    badge: 'Zdarma s limitem',
    pillClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  [MULTISPORT_BENEFIT_TYPES.ENTRY_DISCOUNT]: {
    cz: 'Sleva z běžného vstupného',
    en: 'Entry Fee Discount',
    badge: 'Sleva na vstup',
    pillClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  [MULTISPORT_BENEFIT_TYPES.SURCHARGE_ENTRY]: {
    cz: 'Vstup s doplatkem ke kartě',
    en: 'Copay / Surcharge Required',
    badge: 'Vstup s doplatkem',
    pillClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  [MULTISPORT_BENEFIT_TYPES.NOT_ACCEPTED]: {
    cz: 'MultiSport není akceptována',
    en: 'MultiSport Not Accepted',
    badge: 'Bez MultiSportu',
    pillClass: 'bg-slate-700/40 text-slate-400 border-slate-700',
  },
};

export const COOLING_OPTIONS = {
  INDOOR_PLUNGE_POOL: 'indoor_plunge_pool',
  OUTDOOR_PLUNGE_POOL: 'outdoor_plunge_pool',
  NATURAL_WATER_RIVER: 'natural_water_river',
  NATURAL_WATER_LAKE: 'natural_water_lake',
  ICE_WELL: 'ice_well',
  BUCKET_SHOWER: 'bucket_shower',
  EXPERIENCE_SHOWERS: 'experience_showers',
  SNOW_ROOM: 'snow_room',
  KNEIPP_PATH: 'kneipp_path',
} as const;

export type CoolingOptionCode = typeof COOLING_OPTIONS[keyof typeof COOLING_OPTIONS];

export const COOLING_LABELS: Record<string, { cz: string; icon: string }> = {
  indoor_plunge_pool: { cz: 'Vnitřní ochlazovací bazének', icon: 'Waves' },
  outdoor_plunge_pool: { cz: 'Venkovní ochlazovací bazének', icon: 'Compass' },
  natural_water_river: { cz: 'Přírodní řeka / potok', icon: 'Droplets' },
  natural_water_lake: { cz: 'Přírodní jezero / rybník / biotop', icon: 'Sparkles' },
  ice_well: { cz: 'Ledová studna / tříšť', icon: 'Snowflake' },
  bucket_shower: { cz: 'Polévací vědro', icon: 'Flame' },
  experience_showers: { cz: 'Zážitkové sprchy / mlha', icon: 'CloudRain' },
  snow_room: { cz: 'Sněhová komora', icon: 'Snowflake' },
  kneipp_path: { cz: 'Kneippův chodník', icon: 'Footprints' },
};

export const SAUNA_TYPES = {
  FINNISH_DRY: 'finnish_dry',
  BIO_HERBAL: 'bio_herbal',
  STEAM_BATH: 'steam_bath',
  INFRASAUNA: 'infrasauna',
  CEREMONIAL_HALL: 'ceremonial_hall',
  SALT_SAUNA: 'salt_sauna',
  RUSTIC_BANYA: 'rustic_banya',
  KELO_SAUNA: 'kelo_sauna',
} as const;

export type SaunaTypeCode = typeof SAUNA_TYPES[keyof typeof SAUNA_TYPES];

export const SAUNA_TYPE_LABELS: Record<string, { cz: string; tempDefault: number }> = {
  finnish_dry: { cz: 'Finská suchá sauna', tempDefault: 90 },
  bio_herbal: { cz: 'Biosauna / bylinková', tempDefault: 60 },
  steam_bath: { cz: 'Parní lázeň', tempDefault: 45 },
  infrasauna: { cz: 'Infrasauna', tempDefault: 45 },
  ceremonial_hall: { cz: 'Ceremoniální sál / divadlo', tempDefault: 85 },
  salt_sauna: { cz: 'Solná sauna', tempDefault: 55 },
  rustic_banya: { cz: 'Ruská baňa', tempDefault: 80 },
  kelo_sauna: { cz: 'Kelo srubová sauna', tempDefault: 95 },
};

export const NUDITY_POLICIES = {
  STRICT_NUDIST: 'strict_nudist',
  SWIMWEAR_OPTIONAL: 'swimwear_optional',
  SWIMWEAR_REQUIRED: 'swimwear_required',
  CEREMONIAL_NUDIST_POOL_SWIMWEAR: 'ceremonial_nudist_pool_swimwear',
} as const;

export type NudityPolicyCode = typeof NUDITY_POLICIES[keyof typeof NUDITY_POLICIES];

export const NUDITY_POLICY_LABELS: Record<NudityPolicyCode, { cz: string }> = {
  [NUDITY_POLICIES.STRICT_NUDIST]: { cz: 'Striktně bez plavek (prostěradlo / kilt)' },
  [NUDITY_POLICIES.SWIMWEAR_OPTIONAL]: { cz: 'Plavky dobrovolné' },
  [NUDITY_POLICIES.SWIMWEAR_REQUIRED]: { cz: 'Plavky povinné' },
  [NUDITY_POLICIES.CEREMONIAL_NUDIST_POOL_SWIMWEAR]: { cz: 'Sauny bez plavek, bazény v plavkách' },
};

export const USER_LIST_TYPES = {
  FAVORITE: 'favorite',
  WANT_TO_VISIT: 'want_to_visit',
  VISITED: 'visited',
} as const;

export type UserListTypeCode = typeof USER_LIST_TYPES[keyof typeof USER_LIST_TYPES];

export const USER_LIST_LABELS: Record<UserListTypeCode, { cz: string; icon: string }> = {
  [USER_LIST_TYPES.FAVORITE]: { cz: 'Oblíbené', icon: 'Heart' },
  [USER_LIST_TYPES.WANT_TO_VISIT]: { cz: 'Chci navštívit', icon: 'Bookmark' },
  [USER_LIST_TYPES.VISITED]: { cz: 'Navštíveno', icon: 'CheckCircle2' },
};

export const REVIEW_DIMENSIONS = [
  { key: 'cleanliness', label_cz: 'Čistota prostředí a šaten' },
  { key: 'heat_quality', label_cz: 'Kvalita tepla a páry' },
  { key: 'cooling_quality', label_cz: 'Možnosti ochlazení' },
  { key: 'staff_ceremony', label_cz: 'Personál a saunové ceremoniály' },
  { key: 'price_value', label_cz: 'Poměr cena / výkon' },
] as const;

export interface CzechRegionItem {
  id: string;
  code: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
  zoom: number;
}

export const CZECH_REGIONS: CzechRegionItem[] = [
  { id: 'cz-pha', code: 'PHA', name: 'Hlavní město Praha', shortName: 'Praha', lat: 50.0878, lon: 14.4205, zoom: 11 },
  { id: 'cz-stc', code: 'STC', name: 'Středočeský kraj', shortName: 'Středočeský', lat: 50.0000, lon: 14.7000, zoom: 9 },
  { id: 'cz-jhm', code: 'JHM', name: 'Jihomoravský kraj', shortName: 'Jihomoravský (Brno)', lat: 49.1951, lon: 16.6068, zoom: 10 },
  { id: 'cz-msk', code: 'MSK', name: 'Moravskoslezský kraj', shortName: 'Moravskoslezský (Ostrava)', lat: 49.8347, lon: 18.2820, zoom: 10 },
  { id: 'cz-plk', code: 'PLK', name: 'Plzeňský kraj', shortName: 'Plzeňský', lat: 49.7475, lon: 13.3776, zoom: 10 },
  { id: 'cz-lbk', code: 'LBK', name: 'Liberecký kraj', shortName: 'Liberecký', lat: 50.7671, lon: 15.0562, zoom: 10 },
  { id: 'cz-hkk', code: 'HKK', name: 'Královéhradecký kraj', shortName: 'Královéhradecký', lat: 50.2092, lon: 15.8328, zoom: 10 },
  { id: 'cz-olk', code: 'OLK', name: 'Olomoucký kraj', shortName: 'Olomoucký', lat: 49.5938, lon: 17.2509, zoom: 10 },
  { id: 'cz-jhc', code: 'JHC', name: 'Jihočeský kraj', shortName: 'Jihočeský (Č. Budějovice)', lat: 48.9745, lon: 14.4743, zoom: 10 },
  { id: 'cz-vys', code: 'VYS', name: 'Kraj Vysočina', shortName: 'Vysočina (Jihlava)', lat: 49.3961, lon: 15.5882, zoom: 10 },
  { id: 'cz-ulk', code: 'ULK', name: 'Ústecký kraj', shortName: 'Ústecký', lat: 50.6607, lon: 14.0323, zoom: 10 },
  { id: 'cz-pak', code: 'PAK', name: 'Pardubický kraj', shortName: 'Pardubický', lat: 50.0385, lon: 15.7792, zoom: 10 },
  { id: 'cz-zlk', code: 'ZLK', name: 'Zlínský kraj', shortName: 'Zlínský', lat: 49.2242, lon: 17.6627, zoom: 10 },
  { id: 'cz-kvk', code: 'KVK', name: 'Karlovarský kraj', shortName: 'Karlovarský', lat: 50.2327, lon: 12.8712, zoom: 10 },
];

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  role: 'user' | 'partner' | 'moderator' | 'admin';
  reviews_count: number;
  helpful_votes_received: number;
  bio?: string | null;
}

export const CEREMONY_CATEGORIES = {
  RELAXING: 'relaxing',
  DYNAMIC_SHOW: 'dynamic_show',
  HERBAL: 'herbal',
  SALT_PEELING: 'salt_peeling',
  WHISKS_BIRCH: 'whisks_birch',
  SAUNA_NIGHT: 'sauna_night',
} as const;

export type CeremonyCategoryCode = typeof CEREMONY_CATEGORIES[keyof typeof CEREMONY_CATEGORIES];

export const CEREMONY_CATEGORY_LABELS: Record<CeremonyCategoryCode, { cz: string; en: string }> = {
  [CEREMONY_CATEGORIES.RELAXING]: { cz: 'Relaxační a meditační', en: 'Relaxing & Meditative' },
  [CEREMONY_CATEGORIES.DYNAMIC_SHOW]: { cz: 'Dynamická show a triky s ručníkem', en: 'Dynamic Towel Show' },
  [CEREMONY_CATEGORIES.HERBAL]: { cz: 'Bylinkový a aromaterapie', en: 'Herbal & Aromatherapy' },
  [CEREMONY_CATEGORIES.SALT_PEELING]: { cz: 'Solný peeling a scrub', en: 'Salt Peeling & Scrub' },
  [CEREMONY_CATEGORIES.WHISKS_BIRCH]: { cz: 'Metličkování březovými větvemi', en: 'Birch Venik / Whisking' },
  [CEREMONY_CATEGORIES.SAUNA_NIGHT]: { cz: 'Saunová noc / speciální akce', en: 'Themed Sauna Night' },
};

export interface MultisportInfo {
  is_accepted: boolean;
  benefit_type: MultisportBenefitTypeCode;
  time_limit_minutes?: number | null;
  discount_amount_czk?: number | null;
  discount_percentage?: number | null;
  entry_surcharge_czk?: number | null;
  overtime_surcharge_per_block_czk?: number | null;
  overtime_block_minutes?: number | null;
  towel_sheet_service_included?: boolean;
  note?: string | null;
  badge_label?: string;
  included_zones?: string;
  valid_days?: string;
  valid_hours_description?: string;
}

export interface SaunaSummary {
  id: string;
  name: string;
  slug: string;
  category: VenueCategoryCode;
  short_description: string;
  cover_image_url: string;
  address_street: string;
  address_city: string;
  address_zip: string;
  latitude: number;
  longitude: number;
  region_id: string;
  city_id: string;
  has_plunge_pool: boolean;
  has_outdoor_cooling: boolean;
  has_natural_water: boolean;
  has_ceremonial_hall: boolean;
  has_whirlpool: boolean;
  has_ice_well?: boolean;
  has_bucket_shower?: boolean;
  has_experience_showers?: boolean;
  has_steam_bath?: boolean;
  has_herbal_sauna?: boolean;
  has_private_rental?: boolean;
  rating_overall: number;
  review_count: number;
  favorite_count: number;
  is_promoted: boolean;
  promoted_badge?: string | null;
  distance_km?: number;
  distance_formatted?: string;
  multisport?: MultisportInfo;
  is_verified_partner?: boolean;
}

export interface VenueCoolingOption {
  id: string;
  venue_id: string;
  cooling_option_id: string;
  water_temperature_celsius?: number | null;
  description?: string | null;
  is_featured: boolean;
  name_cz?: string;
  name_en?: string;
  icon_name?: string;
}

export interface VenueSauna {
  id: string;
  venue_id: string;
  sauna_type_id: string;
  custom_name: string;
  temperature_celsius_min: number;
  temperature_celsius_max: number;
  humidity_percentage_min: number;
  humidity_percentage_max: number;
  capacity_persons?: number | null;
  wood_type?: string | null;
  features?: string[] | null;
  description?: string | null;
  name_cz?: string;
  name_en?: string;
}

export interface VenueAmenity {
  id: string;
  venue_id: string;
  amenity_id: string;
  quantity: number;
  description?: string | null;
  name_cz?: string;
  name_en?: string;
  icon_name?: string;
}

export interface VenueOpeningHours {
  id: string;
  venue_id: string;
  day_of_week: number; // 0 = Mon, 6 = Sun
  open_time: string;
  close_time: string;
  is_closed: boolean;
  special_note?: string | null;
}

export interface VenuePricing {
  id: string;
  venue_id: string;
  ticket_name: string;
  duration_minutes?: number | null;
  price_czk: number;
  price_student_czk?: number | null;
  price_senior_czk?: number | null;
  is_default: boolean;
  note?: string | null;
}

export interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  rating_overall: number;
  rating_cleanliness: number;
  rating_heat_steam: number;
  rating_cooling: number;
  rating_staff_ceremonies: number;
  rating_value: number;
  title: string;
  content: string;
  tips?: string | null;
  recommended_time?: string | null;
  visit_date?: string | null;
  is_verified_visit: boolean;
  helpful_votes_count: number;
  status: 'published' | 'hidden' | 'flagged';
  created_at: string;
  user_name?: string;
  user_avatar?: string | null;
  user_role?: string;
}

export interface SaunaCeremony {
  id: string;
  venue_id: string;
  title: string;
  category: string;
  description: string;
  ceremony_master?: string | null;
  hall_name?: string | null;
  day_of_week?: number | null;
  is_recurring: boolean;
  recurrence_pattern?: string | null;
  start_time: string;
  end_time: string;
  event_date?: string | null;
  special_entry_fee_czk: number;
  is_featured: boolean;
  venue_name?: string;
  venue_slug?: string;
}

export interface SaunaDetail extends SaunaSummary {
  description: string;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  booking_url?: string | null;
  gallery_urls?: string[];
  rating_cleanliness: number;
  rating_heat_steam: number;
  rating_cooling: number;
  rating_staff_ceremonies: number;
  rating_value: number;
  policies?: {
    nudity_policy: NudityPolicyCode;
    access_type: string;
    women_only_policy: string;
    children_policy: string;
    barrier_free_access: string;
    parking_policy: string;
    refreshment_type: string;
    towels_and_sheets: string;
    parking_notes?: string | null;
  } | null;
  cooling_options: VenueCoolingOption[];
  saunas: VenueSauna[];
  amenities: VenueAmenity[];
  opening_hours: VenueOpeningHours[];
  pricing: VenuePricing[];
  ceremonies: SaunaCeremony[];
  reviews: Review[];
}

export interface MapMarker {
  id: string;
  name: string;
  slug: string;
  category: VenueCategoryCode;
  latitude: number;
  longitude: number;
  rating_overall: number;
  review_count: number;
  is_promoted: boolean;
  promoted_badge?: string | null;
  address_city: string;
  multisport_benefit?: MultisportBenefitTypeCode;
}

export interface AffiliatePartnerProduct {
  id: string;
  category: string;
  product_name: string;
  partner_shop_name: string;
  image_url: string;
  price_czk: number;
  affiliate_url: string;
  description?: string | null;
  is_active: boolean;
}

export interface UserVenueListEntry {
  list_entry_id: string;
  list_type: UserListTypeCode;
  visited_at?: string | null;
  personal_notes?: string | null;
  added_at: string;
  id: string;
  name: string;
  slug: string;
  category: VenueCategoryCode;
  address_city: string;
  cover_image_url: string;
  rating_overall: number;
  review_count: number;
  short_description?: string;
}

export interface UserListsState {
  favorite: UserVenueListEntry[];
  want_to_visit: UserVenueListEntry[];
  visited: UserVenueListEntry[];
}
