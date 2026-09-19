/**
 * Shared Domain Constants for the Czech Sauna & Wellness Platform
 */

export const VENUE_CATEGORIES = {
  PUBLIC: 'public',
  WELLNESS_CEREMONIAL: 'wellness_ceremonial',
  PRIVATE: 'private',
  HOTEL_MOUNTAIN: 'hotel_mountain',
} as const;

export type VenueCategoryCode = typeof VENUE_CATEGORIES[keyof typeof VENUE_CATEGORIES];

export const VENUE_CATEGORY_LABELS: Record<VenueCategoryCode, { cz: string; en: string; description: string }> = {
  [VENUE_CATEGORIES.PUBLIC]: {
    cz: 'Veřejné sauny a plavecké bazény',
    en: 'Public Saunas & Municipal Pools',
    description: 'Běžně přístupná veřejná saunová centra a bazénové komplexy s příznivou cenou.',
  },
  [VENUE_CATEGORIES.WELLNESS_CEREMONIAL]: {
    cz: 'Zážitková a ceremoniální wellness',
    en: 'Experiential & Ceremonial Wellness',
    description: 'Prémiová saunová centra se saunovými divadly, mistry ručníku a bohatým programem rituálů.',
  },
  [VENUE_CATEGORIES.PRIVATE]: {
    cz: 'Soukromé a privátní sauny',
    en: 'Private Rental & Intimate Saunas',
    description: 'Diskrétní zóny k pronájmu pro páry či uzavřené skupiny s maximálním soukromím.',
  },
  [VENUE_CATEGORIES.HOTEL_MOUNTAIN]: {
    cz: 'Hotelové a horské sauny',
    en: 'Hotel & Mountain Resort Saunas',
    description: 'Wellness centra v horských střediscích a boutique hotelech s panoramatickými výhledy.',
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

export const MULTISPORT_BENEFIT_LABELS: Record<MultisportBenefitTypeCode, { cz: string; en: string; badge: string }> = {
  [MULTISPORT_BENEFIT_TYPES.FREE_UNLIMITED]: {
    cz: '100% vstup zdarma (neomezený čas)',
    en: '100% Free Unlimited Entry',
    badge: 'Zdarma neomezeně',
  },
  [MULTISPORT_BENEFIT_TYPES.FREE_TIME_LIMITED]: {
    cz: 'Časově omezený vstup zdarma (např. 60–120 min)',
    en: 'Time-limited Free Entry',
    badge: 'Zdarma s časovým limitem',
  },
  [MULTISPORT_BENEFIT_TYPES.ENTRY_DISCOUNT]: {
    cz: 'Sleva z běžného vstupného (Kč)',
    en: 'Entry Fee Discount',
    badge: 'Sleva na vstup',
  },
  [MULTISPORT_BENEFIT_TYPES.SURCHARGE_ENTRY]: {
    cz: 'Vstup s doplatkem ke kartě (Kč)',
    en: 'Copay / Surcharge Required',
    badge: 'Vstup s doplatkem',
  },
  [MULTISPORT_BENEFIT_TYPES.NOT_ACCEPTED]: {
    cz: 'Karta MultiSport není akceptována',
    en: 'MultiSport Not Accepted',
    badge: 'Bez MultiSportu',
  },
};

export const MULTISPORT_VALID_DAYS = {
  ALL_WEEK: 'all_week',
  WEEKDAYS_ONLY: 'weekdays_only',
  WEEKDAYS_UNTIL_16: 'weekdays_until_16',
  WEEKENDS_ONLY: 'weekends_only',
} as const;

export type MultisportValidDaysCode = typeof MULTISPORT_VALID_DAYS[keyof typeof MULTISPORT_VALID_DAYS];

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

export const OPERATING_ACCESS_TYPES = {
  PUBLIC_WALKIN: 'public_walkin',
  PUBLIC_RESERVATION_RECOMMENDED: 'public_reservation_recommended',
  PUBLIC_AND_PRIVATE: 'public_and_private',
  STRICTLY_PRIVATE: 'strictly_private',
  HOTEL_GUESTS_AND_PUBLIC: 'hotel_guests_and_public',
} as const;

export type OperatingAccessTypeCode = typeof OPERATING_ACCESS_TYPES[keyof typeof OPERATING_ACCESS_TYPES];

export const NUDITY_POLICIES = {
  STRICT_NUDIST: 'strict_nudist',
  SWIMWEAR_OPTIONAL: 'swimwear_optional',
  SWIMWEAR_REQUIRED: 'swimwear_required',
  CEREMONIAL_NUDIST_POOL_SWIMWEAR: 'ceremonial_nudist_pool_swimwear',
} as const;

export type NudityPolicyCode = typeof NUDITY_POLICIES[keyof typeof NUDITY_POLICIES];

export const NUDITY_POLICY_LABELS: Record<NudityPolicyCode, { cz: string; en: string }> = {
  [NUDITY_POLICIES.STRICT_NUDIST]: {
    cz: 'Striktně bez plavek (prostěradlo / kilt)',
    en: 'Strictly Nude (Textile-Free)',
  },
  [NUDITY_POLICIES.SWIMWEAR_OPTIONAL]: {
    cz: 'Plavky dobrovolné',
    en: 'Swimwear Optional',
  },
  [NUDITY_POLICIES.SWIMWEAR_REQUIRED]: {
    cz: 'Plavky povinné (pouze u vybraných bazénů)',
    en: 'Swimwear Required',
  },
  [NUDITY_POLICIES.CEREMONIAL_NUDIST_POOL_SWIMWEAR]: {
    cz: 'Sauny bez plavek, bazény v plavkách',
    en: 'Nude in Saunas, Swimwear in Pools',
  },
};

export const USER_LIST_TYPES = {
  FAVORITE: 'favorite',
  WANT_TO_VISIT: 'want_to_visit',
  VISITED: 'visited',
} as const;

export type UserListTypeCode = typeof USER_LIST_TYPES[keyof typeof USER_LIST_TYPES];

export const USER_LIST_LABELS: Record<UserListTypeCode, { cz: string; en: string }> = {
  [USER_LIST_TYPES.FAVORITE]: { cz: 'Oblíbené sauny', en: 'Favorite Saunas' },
  [USER_LIST_TYPES.WANT_TO_VISIT]: { cz: 'Chci navštívit', en: 'Want to Visit' },
  [USER_LIST_TYPES.VISITED]: { cz: 'Navštíveno', en: 'Visited' },
};

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

export const REVIEW_DIMENSIONS = [
  { key: 'rating_cleanliness', label_cz: 'Čistota prostředí a šaten', label_en: 'Cleanliness' },
  { key: 'rating_heat_steam', label_cz: 'Kvalita tepla a páry', label_en: 'Heat & Steam Quality' },
  { key: 'rating_cooling', label_cz: 'Možnosti ochlazení', label_en: 'Cooling Options' },
  { key: 'rating_staff_ceremonies', label_cz: 'Personál a saunové ceremoniály', label_en: 'Staff & Ceremonies' },
  { key: 'rating_value', label_cz: 'Poměr cena / výkon', label_en: 'Price to Value' },
] as const;

/**
 * 14 Official Czech Regions (Kraje) with ISO codes, names, and geographic centers
 */
export const CZECH_REGIONS = [
  { id: 'cz-pha', code: 'PHA', name: 'Hlavní město Praha', shortName: 'Praha', lat: 50.0878, lon: 14.4205, zoom: 11 },
  { id: 'cz-stc', code: 'STC', name: 'Středočeský kraj', shortName: 'Středočeský', lat: 50.0000, lon: 14.7000, zoom: 9 },
  { id: 'cz-jhm', code: 'JHM', name: 'Jihomoravský kraj', shortName: 'Jihomoravský', lat: 49.1951, lon: 16.6068, zoom: 10 },
  { id: 'cz-msk', code: 'MSK', name: 'Moravskoslezský kraj', shortName: 'Moravskoslezský', lat: 49.8347, lon: 18.2820, zoom: 10 },
  { id: 'cz-plk', code: 'PLK', name: 'Plzeňský kraj', shortName: 'Plzeňský', lat: 49.7475, lon: 13.3776, zoom: 10 },
  { id: 'cz-lbk', code: 'LBK', name: 'Liberecký kraj', shortName: 'Liberecký', lat: 50.7671, lon: 15.0562, zoom: 10 },
  { id: 'cz-hkk', code: 'HKK', name: 'Královéhradecký kraj', shortName: 'Královéhradecký', lat: 50.2092, lon: 15.8328, zoom: 10 },
  { id: 'cz-olk', code: 'OLK', name: 'Olomoucký kraj', shortName: 'Olomoucký', lat: 49.5938, lon: 17.2509, zoom: 10 },
  { id: 'cz-jhc', code: 'JHC', name: 'Jihočeský kraj', shortName: 'Jihočeský', lat: 48.9745, lon: 14.4743, zoom: 10 },
  { id: 'cz-vys', code: 'VYS', name: 'Kraj Vysočina', shortName: 'Vysočina', lat: 49.3961, lon: 15.5882, zoom: 10 },
  { id: 'cz-ulk', code: 'ULK', name: 'Ústecký kraj', shortName: 'Ústecký', lat: 50.6607, lon: 14.0323, zoom: 10 },
  { id: 'cz-pak', code: 'PAK', name: 'Pardubický kraj', shortName: 'Pardubický', lat: 50.0385, lon: 15.7792, zoom: 10 },
  { id: 'cz-zlk', code: 'ZLK', name: 'Zlínský kraj', shortName: 'Zlínský', lat: 49.2242, lon: 17.6627, zoom: 10 },
  { id: 'cz-kvk', code: 'KVK', name: 'Karlovarský kraj', shortName: 'Karlovarský', lat: 50.2327, lon: 12.8712, zoom: 10 },
] as const;

export const DEFAULT_SEARCH_RADIUS_KM = 50;
export const EARTH_RADIUS_KM = 6371;
export const PRAGUE_CENTER_COORDINATES = { lat: 50.0878, lon: 14.4205 };
