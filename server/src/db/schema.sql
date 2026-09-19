-- ============================================================================
-- CZECH SAUNA & WELLNESS COMMUNITY PLATFORM — RELATIONAL DATABASE SCHEMA DDL
-- Compatible with PostgreSQL (standard) and SQLite (with standard types)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. GEOGRAPHIC HIERARCHY
-- ----------------------------------------------------------------------------

CREATE TABLE countries (
    id VARCHAR(2) PRIMARY KEY, -- ISO 3166-1 alpha-2 ('CZ', 'SK', 'AT', 'DE', 'PL')
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'CZK',
    default_locale VARCHAR(10) NOT NULL DEFAULT 'cs-CZ',
    phone_prefix VARCHAR(10) NOT NULL DEFAULT '+420',
    bounds_north NUMERIC(10,6),
    bounds_south NUMERIC(10,6),
    bounds_east NUMERIC(10,6),
    bounds_west NUMERIC(10,6),
    center_latitude NUMERIC(10,6) NOT NULL DEFAULT 49.8175,
    center_longitude NUMERIC(10,6) NOT NULL DEFAULT 15.4730,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE regions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'cz-pha', 'cz-jhm', 'cz-msk'
    country_id VARCHAR(2) NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    code VARCHAR(10) NOT NULL, -- 'PHA', 'JHM', 'MSK', etc.
    name VARCHAR(100) NOT NULL, -- 'Hlavní město Praha', 'Jihomoravský kraj'
    short_name VARCHAR(50) NOT NULL, -- 'Praha', 'Jihomoravský'
    slug VARCHAR(100) NOT NULL UNIQUE,
    latitude NUMERIC(10,6) NOT NULL,
    longitude NUMERIC(10,6) NOT NULL,
    zoom_level INTEGER NOT NULL DEFAULT 10,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cities (
    id VARCHAR(50) PRIMARY KEY, -- slug or identifier, e.g. 'praha', 'brno', 'ostrava'
    region_id VARCHAR(50) NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    postal_code_prefix VARCHAR(10),
    latitude NUMERIC(10,6) NOT NULL,
    longitude NUMERIC(10,6) NOT NULL,
    is_major BOOLEAN NOT NULL DEFAULT false,
    sauna_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cities_region_slug UNIQUE(region_id, slug)
);

-- ----------------------------------------------------------------------------
-- 2. USER ACCOUNTS & PROFILES
-- ----------------------------------------------------------------------------

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'partner', 'moderator', 'admin')),
    bio TEXT,
    preferred_region_id VARCHAR(50) REFERENCES regions(id) ON DELETE SET NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    helpful_votes_received INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. SAUNA VENUES (CORE ENTITY)
-- ----------------------------------------------------------------------------

CREATE TABLE sauna_venues (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'saunaspot-dvorce', 'infinit-maximus-brno'
    city_id VARCHAR(50) NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    region_id VARCHAR(50) NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    country_id VARCHAR(2) NOT NULL DEFAULT 'CZ' REFERENCES countries(id) ON DELETE RESTRICT,
    
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('public', 'wellness_ceremonial', 'private', 'hotel_mountain')),
    short_description VARCHAR(350) NOT NULL,
    description TEXT NOT NULL,
    
    -- Physical location
    address_street VARCHAR(200) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_zip VARCHAR(20) NOT NULL,
    latitude NUMERIC(10,6) NOT NULL,
    longitude NUMERIC(10,6) NOT NULL,
    
    -- Contact & Web
    phone VARCHAR(50),
    email VARCHAR(150),
    website_url VARCHAR(255),
    booking_url VARCHAR(255),
    
    -- Visuals
    cover_image_url VARCHAR(255) NOT NULL,
    gallery_urls TEXT, -- JSON array of image URLs
    
    -- High-speed denormalized search boolean flags
    has_plunge_pool BOOLEAN NOT NULL DEFAULT false,
    has_outdoor_cooling BOOLEAN NOT NULL DEFAULT false,
    has_natural_water BOOLEAN NOT NULL DEFAULT false,
    has_ice_well BOOLEAN NOT NULL DEFAULT false,
    has_bucket_shower BOOLEAN NOT NULL DEFAULT false,
    has_experience_showers BOOLEAN NOT NULL DEFAULT false,
    has_ceremonial_hall BOOLEAN NOT NULL DEFAULT false,
    has_whirlpool BOOLEAN NOT NULL DEFAULT false,
    has_steam_bath BOOLEAN NOT NULL DEFAULT false,
    has_herbal_sauna BOOLEAN NOT NULL DEFAULT false,
    has_private_rental BOOLEAN NOT NULL DEFAULT false,
    
    -- Denormalized aggregate review stats (ČSFD style)
    rating_overall NUMERIC(3,2) NOT NULL DEFAULT 0.00, -- 1.00 - 5.00
    rating_cleanliness NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    rating_heat_steam NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    rating_cooling NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    rating_staff_ceremonies NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    rating_value NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    favorite_count INTEGER NOT NULL DEFAULT 0,
    
    -- B2B & Promotion metadata
    is_promoted BOOLEAN NOT NULL DEFAULT false,
    promoted_badge VARCHAR(50) DEFAULT NULL, -- 'Doporučeno / Partner', 'Náš tip'
    promoted_tier VARCHAR(30) DEFAULT NULL CHECK (promoted_tier IS NULL OR promoted_tier IN ('basic', 'featured', 'premium')),
    promoted_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    claimed_by_user_id VARCHAR(50) DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_verified_partner BOOLEAN NOT NULL DEFAULT false,
    
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'temporarily_closed', 'permanently_closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. MULTISPORT CARD CONDITIONS (R2 CORE)
-- ----------------------------------------------------------------------------

CREATE TABLE venue_multisport_rules (
    venue_id VARCHAR(50) PRIMARY KEY REFERENCES sauna_venues(id) ON DELETE CASCADE,
    is_accepted BOOLEAN NOT NULL DEFAULT false,
    benefit_type VARCHAR(30) NOT NULL DEFAULT 'not_accepted' 
        CHECK (benefit_type IN ('free_unlimited', 'free_time_limited', 'entry_discount', 'surcharge_entry', 'not_accepted')),
    
    time_limit_minutes INTEGER, -- e.g. 60, 90, 120, or NULL if unlimited/discount
    discount_amount_czk NUMERIC(8,2) DEFAULT NULL, -- e.g. 100.00 CZK
    discount_percentage INTEGER DEFAULT NULL, -- e.g. 20%
    entry_surcharge_czk NUMERIC(8,2) DEFAULT NULL, -- e.g. 120.00 CZK required copay
    overtime_surcharge_per_block_czk NUMERIC(8,2) DEFAULT NULL, -- e.g. 25.00 CZK
    overtime_block_minutes INTEGER DEFAULT NULL, -- e.g. 15 or 30 mins
    
    included_zones VARCHAR(200) NOT NULL DEFAULT 'Saunový svět',
    towel_sheet_service_included BOOLEAN NOT NULL DEFAULT true,
    valid_days VARCHAR(50) NOT NULL DEFAULT 'all_week' CHECK (valid_days IN ('all_week', 'weekdays_only', 'weekdays_until_16', 'weekends_only')),
    valid_hours_description VARCHAR(255) NOT NULL DEFAULT 'Po celou otevírací dobu',
    accepted_card_types TEXT NOT NULL DEFAULT '["multisport_standard"]', -- JSON array
    note TEXT,
    last_verified_at DATE DEFAULT CURRENT_DATE
);

-- ----------------------------------------------------------------------------
-- 5. TAXONOMY CATALOGS: COOLING, SAUNA TYPES, AMENITIES
-- ----------------------------------------------------------------------------

CREATE TABLE cooling_options (
    id VARCHAR(50) PRIMARY KEY, -- 'indoor_plunge_pool', 'outdoor_plunge_pool', 'natural_water_lake', 'natural_water_river', etc.
    name_cz VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('plunge_pool', 'natural_water', 'ice', 'shower', 'special')),
    icon_name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE venue_cooling_options (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    cooling_option_id VARCHAR(50) NOT NULL REFERENCES cooling_options(id) ON DELETE RESTRICT,
    water_temperature_celsius NUMERIC(3,1), -- e.g. 8.5 °C
    description VARCHAR(255),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_venue_cooling UNIQUE(venue_id, cooling_option_id)
);

CREATE TABLE sauna_types (
    id VARCHAR(50) PRIMARY KEY, -- 'finnish_dry', 'bio_herbal', 'steam_bath', 'infrasauna', 'ceremonial_hall', 'salt_sauna', 'rustic_banya', 'kelo_sauna'
    name_cz VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    default_temp_celsius INTEGER NOT NULL,
    default_humidity_percentage INTEGER NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE venue_saunas (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    sauna_type_id VARCHAR(50) NOT NULL REFERENCES sauna_types(id) ON DELETE RESTRICT,
    custom_name VARCHAR(120) NOT NULL, -- e.g. 'Panoramatická finská sauna na jezeře'
    temperature_celsius_min INTEGER NOT NULL,
    temperature_celsius_max INTEGER NOT NULL,
    humidity_percentage_min INTEGER NOT NULL,
    humidity_percentage_max INTEGER NOT NULL,
    capacity_persons INTEGER,
    wood_type VARCHAR(100),
    stove_type VARCHAR(100),
    features TEXT, -- JSON array
    description TEXT,
    photo_url VARCHAR(255)
);

CREATE TABLE amenity_facilities (
    id VARCHAR(50) PRIMARY KEY, -- 'whirlpool_indoor', 'whirlpool_outdoor', 'outdoor_garden', 'relaxation_room_silent', 'kneipp_path'
    name_cz VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE venue_amenities (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    amenity_id VARCHAR(50) NOT NULL REFERENCES amenity_facilities(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    description VARCHAR(255),
    CONSTRAINT uq_venue_amenity UNIQUE(venue_id, amenity_id)
);

-- ----------------------------------------------------------------------------
-- 6. OPERATING POLICIES, OPENING HOURS & PRICING
-- ----------------------------------------------------------------------------

CREATE TABLE venue_operating_policies (
    venue_id VARCHAR(50) PRIMARY KEY REFERENCES sauna_venues(id) ON DELETE CASCADE,
    access_type VARCHAR(35) NOT NULL DEFAULT 'public_walkin'
        CHECK (access_type IN ('public_walkin', 'public_reservation_recommended', 'public_and_private', 'strictly_private', 'hotel_guests_and_public')),
    nudity_policy VARCHAR(35) NOT NULL DEFAULT 'strict_nudist'
        CHECK (nudity_policy IN ('strict_nudist', 'swimwear_optional', 'swimwear_required', 'ceremonial_nudist_pool_swimwear')),
    women_only_policy VARCHAR(30) NOT NULL DEFAULT 'none'
        CHECK (women_only_policy IN ('none', 'dedicated_days', 'dedicated_hours', 'dedicated_private_zone')),
    women_only_schedule_note VARCHAR(255),
    men_only_schedule_note VARCHAR(255),
    children_policy VARCHAR(30) NOT NULL DEFAULT 'children_welcome'
        CHECK (children_policy IN ('adults_only', 'children_welcome', 'family_hours')),
    children_min_age INTEGER DEFAULT NULL,
    barrier_free_access VARCHAR(20) NOT NULL DEFAULT 'partial'
        CHECK (barrier_free_access IN ('full', 'partial', 'no')),
    parking_policy VARCHAR(30) NOT NULL DEFAULT 'free_onsite'
        CHECK (parking_policy IN ('free_onsite', 'paid_onsite', 'street_public', 'no_parking')),
    parking_notes VARCHAR(255),
    refreshment_type VARCHAR(30) NOT NULL DEFAULT 'sauna_bar_full'
        CHECK (refreshment_type IN ('sauna_bar_full', 'bistro_restaurant', 'vending_water_only', 'water_station_free', 'none')),
    towels_and_sheets VARCHAR(30) NOT NULL DEFAULT 'included_free'
        CHECK (towels_and_sheets IN ('included_free', 'rental_fee', 'bring_own'))
);

CREATE TABLE venue_opening_hours (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Pondělí (Mon), 6 = Neděle (Sun)
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    special_note VARCHAR(150),
    CONSTRAINT uq_venue_day UNIQUE(venue_id, day_of_week)
);

CREATE TABLE venue_pricing (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    ticket_name VARCHAR(120) NOT NULL,
    duration_minutes INTEGER, -- NULL = unlimited
    price_czk NUMERIC(8,2) NOT NULL,
    price_student_czk NUMERIC(8,2),
    price_senior_czk NUMERIC(8,2),
    is_default BOOLEAN NOT NULL DEFAULT false,
    note VARCHAR(200)
);

-- ----------------------------------------------------------------------------
-- 7. MULTI-CRITERIA COMMUNITY REVIEWS (ČSFD STYLE)
-- ----------------------------------------------------------------------------

CREATE TABLE reviews (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sub-criteria ratings (1 to 5 stars)
    rating_overall INTEGER NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    rating_cleanliness INTEGER NOT NULL CHECK (rating_cleanliness BETWEEN 1 AND 5),
    rating_heat_steam INTEGER NOT NULL CHECK (rating_heat_steam BETWEEN 1 AND 5),
    rating_cooling INTEGER NOT NULL CHECK (rating_cooling BETWEEN 1 AND 5),
    rating_staff_ceremonies INTEGER NOT NULL CHECK (rating_staff_ceremonies BETWEEN 1 AND 5),
    rating_value INTEGER NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    tips TEXT, -- User tips (best hour, parking tips, etc.)
    recommended_time VARCHAR(100),
    visit_date DATE,
    is_verified_visit BOOLEAN NOT NULL DEFAULT false,
    helpful_votes_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_venue_review UNIQUE(venue_id, user_id)
);

CREATE TABLE review_photos (
    id VARCHAR(50) PRIMARY KEY,
    review_id VARCHAR(50) NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url VARCHAR(255) NOT NULL,
    caption VARCHAR(200),
    is_approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_helpful_votes (
    id VARCHAR(50) PRIMARY KEY,
    review_id VARCHAR(50) NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_review_helpful_user UNIQUE(review_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 8. USER LISTS (Oblíbené, Chci navštívit, Navštíveno)
-- ----------------------------------------------------------------------------

CREATE TABLE user_venue_lists (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    list_type VARCHAR(30) NOT NULL CHECK (list_type IN ('favorite', 'want_to_visit', 'visited')),
    visited_at DATE,
    personal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_venue_list_type UNIQUE(user_id, venue_id, list_type)
);

-- ----------------------------------------------------------------------------
-- 9. COMMUNITY PROPOSALS & MODERATION WORKFLOW
-- ----------------------------------------------------------------------------

CREATE TABLE venue_suggestions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    submitter_name VARCHAR(100) NOT NULL,
    submitter_email VARCHAR(150) NOT NULL,
    venue_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    street_address VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    region_id VARCHAR(50) NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    postal_code VARCHAR(20),
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    website_url VARCHAR(255),
    phone VARCHAR(50),
    multisport_accepted BOOLEAN NOT NULL DEFAULT false,
    multisport_details TEXT,
    sauna_types TEXT, -- JSON array
    cooling_options TEXT, -- JSON array
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    moderator_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    moderator_comment TEXT,
    created_venue_id VARCHAR(50) REFERENCES sauna_venues(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE venue_edit_suggestions (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    submitter_email VARCHAR(150) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('outdated_hours', 'outdated_pricing', 'multisport_rule_changed', 'closed_venue', 'incorrect_amenities', 'other')),
    details TEXT NOT NULL,
    suggested_data TEXT, -- JSON
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ----------------------------------------------------------------------------
-- 10. B2B CLAIM PROFILE, CEREMONY CALENDAR & AFFILIATE PRODUCTS
-- ----------------------------------------------------------------------------

CREATE TABLE venue_claims (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    ico VARCHAR(20) NOT NULL, -- Czech Business Identification Number (IČO)
    applicant_name VARCHAR(100) NOT NULL,
    applicant_role VARCHAR(100) NOT NULL,
    official_email VARCHAR(150) NOT NULL,
    official_phone VARCHAR(50) NOT NULL,
    billing_address TEXT,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verification_method VARCHAR(50) NOT NULL DEFAULT 'corporate_domain_email',
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE sauna_ceremonies (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) NOT NULL REFERENCES sauna_venues(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('relaxing', 'dynamic_show', 'herbal', 'salt_peeling', 'whisks_birch', 'sauna_night')),
    description TEXT NOT NULL,
    ceremony_master VARCHAR(100),
    hall_name VARCHAR(100),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    is_recurring BOOLEAN NOT NULL DEFAULT true,
    recurrence_pattern VARCHAR(50) DEFAULT 'weekly',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    event_date DATE, -- NULL for recurring weekly
    special_entry_fee_czk NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE affiliate_partner_products (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('sauna_hats', 'essential_oils', 'kilts_towels', 'peelings', 'thermometers_accessories')),
    product_name VARCHAR(150) NOT NULL,
    partner_shop_name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    price_czk NUMERIC(8,2) NOT NULL,
    affiliate_url VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE partner_referral_clicks (
    id VARCHAR(50) PRIMARY KEY,
    venue_id VARCHAR(50) REFERENCES sauna_venues(id) ON DELETE SET NULL,
    affiliate_product_id VARCHAR(50) REFERENCES affiliate_partner_products(id) ON DELETE SET NULL,
    click_type VARCHAR(30) NOT NULL CHECK (click_type IN ('venue_booking_url', 'venue_website', 'affiliate_product')),
    user_agent VARCHAR(255),
    referrer VARCHAR(255),
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. INDEXES FOR HIGH-PERFORMANCE SEARCH & GEOLOCATION
-- ----------------------------------------------------------------------------

-- Geolocation & Map bounding queries
CREATE INDEX idx_sauna_venues_lat_lon ON sauna_venues(latitude, longitude);
CREATE INDEX idx_sauna_venues_city ON sauna_venues(city_id);
CREATE INDEX idx_sauna_venues_region ON sauna_venues(region_id);
CREATE INDEX idx_sauna_venues_category ON sauna_venues(category);
CREATE INDEX idx_sauna_venues_status ON sauna_venues(status);
CREATE INDEX idx_sauna_venues_promoted ON sauna_venues(is_promoted, rating_overall DESC);

-- Fast combined filter index (MultiSport + Plunge Pool + Types)
CREATE INDEX idx_sauna_venues_cooling_flags ON sauna_venues(has_plunge_pool, has_outdoor_cooling, has_natural_water);
CREATE INDEX idx_multisport_rules_lookup ON venue_multisport_rules(is_accepted, benefit_type, time_limit_minutes);

-- Review lookups & aggregates
CREATE INDEX idx_reviews_venue_created ON reviews(venue_id, created_at DESC);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_user_lists_user_type ON user_venue_lists(user_id, list_type);

-- Ceremonies schedule
CREATE INDEX idx_ceremonies_venue_time ON sauna_ceremonies(venue_id, day_of_week, start_time);
CREATE INDEX idx_ceremonies_date ON sauna_ceremonies(event_date);
