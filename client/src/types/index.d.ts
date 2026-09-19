/**
 * Client Domain Types & Constants
 * Fully synchronized with shared/types.ts and shared/constants.ts
 */
export declare const VENUE_CATEGORIES: {
    readonly PUBLIC: "public";
    readonly WELLNESS_CEREMONIAL: "wellness_ceremonial";
    readonly PRIVATE: "private";
    readonly HOTEL_MOUNTAIN: "hotel_mountain";
};
export type VenueCategoryCode = typeof VENUE_CATEGORIES[keyof typeof VENUE_CATEGORIES];
export declare const VENUE_CATEGORY_LABELS: Record<VenueCategoryCode, {
    cz: string;
    en: string;
    description: string;
    color: string;
    badgeBg: string;
}>;
export declare const MULTISPORT_BENEFIT_TYPES: {
    readonly FREE_UNLIMITED: "free_unlimited";
    readonly FREE_TIME_LIMITED: "free_time_limited";
    readonly ENTRY_DISCOUNT: "entry_discount";
    readonly SURCHARGE_ENTRY: "surcharge_entry";
    readonly NOT_ACCEPTED: "not_accepted";
};
export type MultisportBenefitTypeCode = typeof MULTISPORT_BENEFIT_TYPES[keyof typeof MULTISPORT_BENEFIT_TYPES];
export declare const MULTISPORT_BENEFIT_LABELS: Record<MultisportBenefitTypeCode, {
    cz: string;
    en: string;
    badge: string;
    pillClass: string;
}>;
export declare const COOLING_OPTIONS: {
    readonly INDOOR_PLUNGE_POOL: "indoor_plunge_pool";
    readonly OUTDOOR_PLUNGE_POOL: "outdoor_plunge_pool";
    readonly NATURAL_WATER_RIVER: "natural_water_river";
    readonly NATURAL_WATER_LAKE: "natural_water_lake";
    readonly ICE_WELL: "ice_well";
    readonly BUCKET_SHOWER: "bucket_shower";
    readonly EXPERIENCE_SHOWERS: "experience_showers";
    readonly SNOW_ROOM: "snow_room";
    readonly KNEIPP_PATH: "kneipp_path";
};
export type CoolingOptionCode = typeof COOLING_OPTIONS[keyof typeof COOLING_OPTIONS];
export declare const COOLING_LABELS: Record<string, {
    cz: string;
    icon: string;
}>;
export declare const SAUNA_TYPES: {
    readonly FINNISH_DRY: "finnish_dry";
    readonly BIO_HERBAL: "bio_herbal";
    readonly STEAM_BATH: "steam_bath";
    readonly INFRASAUNA: "infrasauna";
    readonly CEREMONIAL_HALL: "ceremonial_hall";
    readonly SALT_SAUNA: "salt_sauna";
    readonly RUSTIC_BANYA: "rustic_banya";
    readonly KELO_SAUNA: "kelo_sauna";
};
export type SaunaTypeCode = typeof SAUNA_TYPES[keyof typeof SAUNA_TYPES];
export declare const SAUNA_TYPE_LABELS: Record<string, {
    cz: string;
    tempDefault: number;
}>;
export declare const NUDITY_POLICIES: {
    readonly STRICT_NUDIST: "strict_nudist";
    readonly SWIMWEAR_OPTIONAL: "swimwear_optional";
    readonly SWIMWEAR_REQUIRED: "swimwear_required";
    readonly CEREMONIAL_NUDIST_POOL_SWIMWEAR: "ceremonial_nudist_pool_swimwear";
};
export type NudityPolicyCode = typeof NUDITY_POLICIES[keyof typeof NUDITY_POLICIES];
export declare const NUDITY_POLICY_LABELS: Record<NudityPolicyCode, {
    cz: string;
}>;
export declare const USER_LIST_TYPES: {
    readonly FAVORITE: "favorite";
    readonly WANT_TO_VISIT: "want_to_visit";
    readonly VISITED: "visited";
};
export type UserListTypeCode = typeof USER_LIST_TYPES[keyof typeof USER_LIST_TYPES];
export declare const USER_LIST_LABELS: Record<UserListTypeCode, {
    cz: string;
    icon: string;
}>;
export declare const REVIEW_DIMENSIONS: readonly [{
    readonly key: "cleanliness";
    readonly label_cz: "Čistota prostředí a šaten";
}, {
    readonly key: "heat_quality";
    readonly label_cz: "Kvalita tepla a páry";
}, {
    readonly key: "cooling_quality";
    readonly label_cz: "Možnosti ochlazení";
}, {
    readonly key: "staff_ceremony";
    readonly label_cz: "Personál a saunové ceremoniály";
}, {
    readonly key: "price_value";
    readonly label_cz: "Poměr cena / výkon";
}];
export interface CzechRegionItem {
    id: string;
    code: string;
    name: string;
    shortName: string;
    lat: number;
    lon: number;
    zoom: number;
}
export declare const CZECH_REGIONS: CzechRegionItem[];
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
export declare const CEREMONY_CATEGORIES: {
    readonly RELAXING: "relaxing";
    readonly DYNAMIC_SHOW: "dynamic_show";
    readonly HERBAL: "herbal";
    readonly SALT_PEELING: "salt_peeling";
    readonly WHISKS_BIRCH: "whisks_birch";
    readonly SAUNA_NIGHT: "sauna_night";
};
export type CeremonyCategoryCode = typeof CEREMONY_CATEGORIES[keyof typeof CEREMONY_CATEGORIES];
export declare const CEREMONY_CATEGORY_LABELS: Record<CeremonyCategoryCode, {
    cz: string;
    en: string;
}>;
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
    day_of_week: number;
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
