/**
 * Shared Domain Constants for the Czech Sauna & Wellness Platform
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
}>;
export declare const MULTISPORT_VALID_DAYS: {
    readonly ALL_WEEK: "all_week";
    readonly WEEKDAYS_ONLY: "weekdays_only";
    readonly WEEKDAYS_UNTIL_16: "weekdays_until_16";
    readonly WEEKENDS_ONLY: "weekends_only";
};
export type MultisportValidDaysCode = typeof MULTISPORT_VALID_DAYS[keyof typeof MULTISPORT_VALID_DAYS];
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
export declare const OPERATING_ACCESS_TYPES: {
    readonly PUBLIC_WALKIN: "public_walkin";
    readonly PUBLIC_RESERVATION_RECOMMENDED: "public_reservation_recommended";
    readonly PUBLIC_AND_PRIVATE: "public_and_private";
    readonly STRICTLY_PRIVATE: "strictly_private";
    readonly HOTEL_GUESTS_AND_PUBLIC: "hotel_guests_and_public";
};
export type OperatingAccessTypeCode = typeof OPERATING_ACCESS_TYPES[keyof typeof OPERATING_ACCESS_TYPES];
export declare const NUDITY_POLICIES: {
    readonly STRICT_NUDIST: "strict_nudist";
    readonly SWIMWEAR_OPTIONAL: "swimwear_optional";
    readonly SWIMWEAR_REQUIRED: "swimwear_required";
    readonly CEREMONIAL_NUDIST_POOL_SWIMWEAR: "ceremonial_nudist_pool_swimwear";
};
export type NudityPolicyCode = typeof NUDITY_POLICIES[keyof typeof NUDITY_POLICIES];
export declare const NUDITY_POLICY_LABELS: Record<NudityPolicyCode, {
    cz: string;
    en: string;
}>;
export declare const USER_LIST_TYPES: {
    readonly FAVORITE: "favorite";
    readonly WANT_TO_VISIT: "want_to_visit";
    readonly VISITED: "visited";
};
export type UserListTypeCode = typeof USER_LIST_TYPES[keyof typeof USER_LIST_TYPES];
export declare const USER_LIST_LABELS: Record<UserListTypeCode, {
    cz: string;
    en: string;
}>;
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
export declare const REVIEW_DIMENSIONS: readonly [{
    readonly key: "rating_cleanliness";
    readonly label_cz: "Čistota prostředí a šaten";
    readonly label_en: "Cleanliness";
}, {
    readonly key: "rating_heat_steam";
    readonly label_cz: "Kvalita tepla a páry";
    readonly label_en: "Heat & Steam Quality";
}, {
    readonly key: "rating_cooling";
    readonly label_cz: "Možnosti ochlazení";
    readonly label_en: "Cooling Options";
}, {
    readonly key: "rating_staff_ceremonies";
    readonly label_cz: "Personál a saunové ceremoniály";
    readonly label_en: "Staff & Ceremonies";
}, {
    readonly key: "rating_value";
    readonly label_cz: "Poměr cena / výkon";
    readonly label_en: "Price to Value";
}];
/**
 * 14 Official Czech Regions (Kraje) with ISO codes, names, and geographic centers
 */
export declare const CZECH_REGIONS: readonly [{
    readonly id: "cz-pha";
    readonly code: "PHA";
    readonly name: "Hlavní město Praha";
    readonly shortName: "Praha";
    readonly lat: 50.0878;
    readonly lon: 14.4205;
    readonly zoom: 11;
}, {
    readonly id: "cz-stc";
    readonly code: "STC";
    readonly name: "Středočeský kraj";
    readonly shortName: "Středočeský";
    readonly lat: 50;
    readonly lon: 14.7;
    readonly zoom: 9;
}, {
    readonly id: "cz-jhm";
    readonly code: "JHM";
    readonly name: "Jihomoravský kraj";
    readonly shortName: "Jihomoravský";
    readonly lat: 49.1951;
    readonly lon: 16.6068;
    readonly zoom: 10;
}, {
    readonly id: "cz-msk";
    readonly code: "MSK";
    readonly name: "Moravskoslezský kraj";
    readonly shortName: "Moravskoslezský";
    readonly lat: 49.8347;
    readonly lon: 18.282;
    readonly zoom: 10;
}, {
    readonly id: "cz-plk";
    readonly code: "PLK";
    readonly name: "Plzeňský kraj";
    readonly shortName: "Plzeňský";
    readonly lat: 49.7475;
    readonly lon: 13.3776;
    readonly zoom: 10;
}, {
    readonly id: "cz-lbk";
    readonly code: "LBK";
    readonly name: "Liberecký kraj";
    readonly shortName: "Liberecký";
    readonly lat: 50.7671;
    readonly lon: 15.0562;
    readonly zoom: 10;
}, {
    readonly id: "cz-hkk";
    readonly code: "HKK";
    readonly name: "Královéhradecký kraj";
    readonly shortName: "Královéhradecký";
    readonly lat: 50.2092;
    readonly lon: 15.8328;
    readonly zoom: 10;
}, {
    readonly id: "cz-olk";
    readonly code: "OLK";
    readonly name: "Olomoucký kraj";
    readonly shortName: "Olomoucký";
    readonly lat: 49.5938;
    readonly lon: 17.2509;
    readonly zoom: 10;
}, {
    readonly id: "cz-jhc";
    readonly code: "JHC";
    readonly name: "Jihočeský kraj";
    readonly shortName: "Jihočeský";
    readonly lat: 48.9745;
    readonly lon: 14.4743;
    readonly zoom: 10;
}, {
    readonly id: "cz-vys";
    readonly code: "VYS";
    readonly name: "Kraj Vysočina";
    readonly shortName: "Vysočina";
    readonly lat: 49.3961;
    readonly lon: 15.5882;
    readonly zoom: 10;
}, {
    readonly id: "cz-ulk";
    readonly code: "ULK";
    readonly name: "Ústecký kraj";
    readonly shortName: "Ústecký";
    readonly lat: 50.6607;
    readonly lon: 14.0323;
    readonly zoom: 10;
}, {
    readonly id: "cz-pak";
    readonly code: "PAK";
    readonly name: "Pardubický kraj";
    readonly shortName: "Pardubický";
    readonly lat: 50.0385;
    readonly lon: 15.7792;
    readonly zoom: 10;
}, {
    readonly id: "cz-zlk";
    readonly code: "ZLK";
    readonly name: "Zlínský kraj";
    readonly shortName: "Zlínský";
    readonly lat: 49.2242;
    readonly lon: 17.6627;
    readonly zoom: 10;
}, {
    readonly id: "cz-kvk";
    readonly code: "KVK";
    readonly name: "Karlovarský kraj";
    readonly shortName: "Karlovarský";
    readonly lat: 50.2327;
    readonly lon: 12.8712;
    readonly zoom: 10;
}];
export declare const DEFAULT_SEARCH_RADIUS_KM = 50;
export declare const EARTH_RADIUS_KM = 6371;
export declare const PRAGUE_CENTER_COORDINATES: {
    lat: number;
    lon: number;
};
