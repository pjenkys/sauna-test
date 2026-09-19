"use strict";
/**
 * Shared Domain Constants for the Czech Sauna & Wellness Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRAGUE_CENTER_COORDINATES = exports.EARTH_RADIUS_KM = exports.DEFAULT_SEARCH_RADIUS_KM = exports.CZECH_REGIONS = exports.REVIEW_DIMENSIONS = exports.CEREMONY_CATEGORY_LABELS = exports.CEREMONY_CATEGORIES = exports.USER_LIST_LABELS = exports.USER_LIST_TYPES = exports.NUDITY_POLICY_LABELS = exports.NUDITY_POLICIES = exports.OPERATING_ACCESS_TYPES = exports.SAUNA_TYPES = exports.COOLING_OPTIONS = exports.MULTISPORT_VALID_DAYS = exports.MULTISPORT_BENEFIT_LABELS = exports.MULTISPORT_BENEFIT_TYPES = exports.VENUE_CATEGORY_LABELS = exports.VENUE_CATEGORIES = void 0;
exports.VENUE_CATEGORIES = {
    PUBLIC: 'public',
    WELLNESS_CEREMONIAL: 'wellness_ceremonial',
    PRIVATE: 'private',
    HOTEL_MOUNTAIN: 'hotel_mountain',
};
exports.VENUE_CATEGORY_LABELS = {
    [exports.VENUE_CATEGORIES.PUBLIC]: {
        cz: 'Veřejné sauny a plavecké bazény',
        en: 'Public Saunas & Municipal Pools',
        description: 'Běžně přístupná veřejná saunová centra a bazénové komplexy s příznivou cenou.',
    },
    [exports.VENUE_CATEGORIES.WELLNESS_CEREMONIAL]: {
        cz: 'Zážitková a ceremoniální wellness',
        en: 'Experiential & Ceremonial Wellness',
        description: 'Prémiová saunová centra se saunovými divadly, mistry ručníku a bohatým programem rituálů.',
    },
    [exports.VENUE_CATEGORIES.PRIVATE]: {
        cz: 'Soukromé a privátní sauny',
        en: 'Private Rental & Intimate Saunas',
        description: 'Diskrétní zóny k pronájmu pro páry či uzavřené skupiny s maximálním soukromím.',
    },
    [exports.VENUE_CATEGORIES.HOTEL_MOUNTAIN]: {
        cz: 'Hotelové a horské sauny',
        en: 'Hotel & Mountain Resort Saunas',
        description: 'Wellness centra v horských střediscích a boutique hotelech s panoramatickými výhledy.',
    },
};
exports.MULTISPORT_BENEFIT_TYPES = {
    FREE_UNLIMITED: 'free_unlimited',
    FREE_TIME_LIMITED: 'free_time_limited',
    ENTRY_DISCOUNT: 'entry_discount',
    SURCHARGE_ENTRY: 'surcharge_entry',
    NOT_ACCEPTED: 'not_accepted',
};
exports.MULTISPORT_BENEFIT_LABELS = {
    [exports.MULTISPORT_BENEFIT_TYPES.FREE_UNLIMITED]: {
        cz: '100% vstup zdarma (neomezený čas)',
        en: '100% Free Unlimited Entry',
        badge: 'Zdarma neomezeně',
    },
    [exports.MULTISPORT_BENEFIT_TYPES.FREE_TIME_LIMITED]: {
        cz: 'Časově omezený vstup zdarma (např. 60–120 min)',
        en: 'Time-limited Free Entry',
        badge: 'Zdarma s časovým limitem',
    },
    [exports.MULTISPORT_BENEFIT_TYPES.ENTRY_DISCOUNT]: {
        cz: 'Sleva z běžného vstupného (Kč)',
        en: 'Entry Fee Discount',
        badge: 'Sleva na vstup',
    },
    [exports.MULTISPORT_BENEFIT_TYPES.SURCHARGE_ENTRY]: {
        cz: 'Vstup s doplatkem ke kartě (Kč)',
        en: 'Copay / Surcharge Required',
        badge: 'Vstup s doplatkem',
    },
    [exports.MULTISPORT_BENEFIT_TYPES.NOT_ACCEPTED]: {
        cz: 'Karta MultiSport není akceptována',
        en: 'MultiSport Not Accepted',
        badge: 'Bez MultiSportu',
    },
};
exports.MULTISPORT_VALID_DAYS = {
    ALL_WEEK: 'all_week',
    WEEKDAYS_ONLY: 'weekdays_only',
    WEEKDAYS_UNTIL_16: 'weekdays_until_16',
    WEEKENDS_ONLY: 'weekends_only',
};
exports.COOLING_OPTIONS = {
    INDOOR_PLUNGE_POOL: 'indoor_plunge_pool',
    OUTDOOR_PLUNGE_POOL: 'outdoor_plunge_pool',
    NATURAL_WATER_RIVER: 'natural_water_river',
    NATURAL_WATER_LAKE: 'natural_water_lake',
    ICE_WELL: 'ice_well',
    BUCKET_SHOWER: 'bucket_shower',
    EXPERIENCE_SHOWERS: 'experience_showers',
    SNOW_ROOM: 'snow_room',
    KNEIPP_PATH: 'kneipp_path',
};
exports.SAUNA_TYPES = {
    FINNISH_DRY: 'finnish_dry',
    BIO_HERBAL: 'bio_herbal',
    STEAM_BATH: 'steam_bath',
    INFRASAUNA: 'infrasauna',
    CEREMONIAL_HALL: 'ceremonial_hall',
    SALT_SAUNA: 'salt_sauna',
    RUSTIC_BANYA: 'rustic_banya',
    KELO_SAUNA: 'kelo_sauna',
};
exports.OPERATING_ACCESS_TYPES = {
    PUBLIC_WALKIN: 'public_walkin',
    PUBLIC_RESERVATION_RECOMMENDED: 'public_reservation_recommended',
    PUBLIC_AND_PRIVATE: 'public_and_private',
    STRICTLY_PRIVATE: 'strictly_private',
    HOTEL_GUESTS_AND_PUBLIC: 'hotel_guests_and_public',
};
exports.NUDITY_POLICIES = {
    STRICT_NUDIST: 'strict_nudist',
    SWIMWEAR_OPTIONAL: 'swimwear_optional',
    SWIMWEAR_REQUIRED: 'swimwear_required',
    CEREMONIAL_NUDIST_POOL_SWIMWEAR: 'ceremonial_nudist_pool_swimwear',
};
exports.NUDITY_POLICY_LABELS = {
    [exports.NUDITY_POLICIES.STRICT_NUDIST]: {
        cz: 'Striktně bez plavek (prostěradlo / kilt)',
        en: 'Strictly Nude (Textile-Free)',
    },
    [exports.NUDITY_POLICIES.SWIMWEAR_OPTIONAL]: {
        cz: 'Plavky dobrovolné',
        en: 'Swimwear Optional',
    },
    [exports.NUDITY_POLICIES.SWIMWEAR_REQUIRED]: {
        cz: 'Plavky povinné (pouze u vybraných bazénů)',
        en: 'Swimwear Required',
    },
    [exports.NUDITY_POLICIES.CEREMONIAL_NUDIST_POOL_SWIMWEAR]: {
        cz: 'Sauny bez plavek, bazény v plavkách',
        en: 'Nude in Saunas, Swimwear in Pools',
    },
};
exports.USER_LIST_TYPES = {
    FAVORITE: 'favorite',
    WANT_TO_VISIT: 'want_to_visit',
    VISITED: 'visited',
};
exports.USER_LIST_LABELS = {
    [exports.USER_LIST_TYPES.FAVORITE]: { cz: 'Oblíbené sauny', en: 'Favorite Saunas' },
    [exports.USER_LIST_TYPES.WANT_TO_VISIT]: { cz: 'Chci navštívit', en: 'Want to Visit' },
    [exports.USER_LIST_TYPES.VISITED]: { cz: 'Navštíveno', en: 'Visited' },
};
exports.CEREMONY_CATEGORIES = {
    RELAXING: 'relaxing',
    DYNAMIC_SHOW: 'dynamic_show',
    HERBAL: 'herbal',
    SALT_PEELING: 'salt_peeling',
    WHISKS_BIRCH: 'whisks_birch',
    SAUNA_NIGHT: 'sauna_night',
};
exports.CEREMONY_CATEGORY_LABELS = {
    [exports.CEREMONY_CATEGORIES.RELAXING]: { cz: 'Relaxační a meditační', en: 'Relaxing & Meditative' },
    [exports.CEREMONY_CATEGORIES.DYNAMIC_SHOW]: { cz: 'Dynamická show a triky s ručníkem', en: 'Dynamic Towel Show' },
    [exports.CEREMONY_CATEGORIES.HERBAL]: { cz: 'Bylinkový a aromaterapie', en: 'Herbal & Aromatherapy' },
    [exports.CEREMONY_CATEGORIES.SALT_PEELING]: { cz: 'Solný peeling a scrub', en: 'Salt Peeling & Scrub' },
    [exports.CEREMONY_CATEGORIES.WHISKS_BIRCH]: { cz: 'Metličkování březovými větvemi', en: 'Birch Venik / Whisking' },
    [exports.CEREMONY_CATEGORIES.SAUNA_NIGHT]: { cz: 'Saunová noc / speciální akce', en: 'Themed Sauna Night' },
};
exports.REVIEW_DIMENSIONS = [
    { key: 'rating_cleanliness', label_cz: 'Čistota prostředí a šaten', label_en: 'Cleanliness' },
    { key: 'rating_heat_steam', label_cz: 'Kvalita tepla a páry', label_en: 'Heat & Steam Quality' },
    { key: 'rating_cooling', label_cz: 'Možnosti ochlazení', label_en: 'Cooling Options' },
    { key: 'rating_staff_ceremonies', label_cz: 'Personál a saunové ceremoniály', label_en: 'Staff & Ceremonies' },
    { key: 'rating_value', label_cz: 'Poměr cena / výkon', label_en: 'Price to Value' },
];
/**
 * 14 Official Czech Regions (Kraje) with ISO codes, names, and geographic centers
 */
exports.CZECH_REGIONS = [
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
];
exports.DEFAULT_SEARCH_RADIUS_KM = 50;
exports.EARTH_RADIUS_KM = 6371;
exports.PRAGUE_CENTER_COORDINATES = { lat: 50.0878, lon: 14.4205 };
