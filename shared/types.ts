/**
 * Shared TypeScript Domain Models for the Czech Sauna & Wellness Platform
 */

import {
  VenueCategoryCode,
  MultisportBenefitTypeCode,
  MultisportValidDaysCode,
  CoolingOptionCode,
  SaunaTypeCode,
  OperatingAccessTypeCode,
  NudityPolicyCode,
  UserListTypeCode,
  CeremonyCategoryCode,
} from './constants';

// ----------------------------------------------------------------------------
// 1. Geographic Hierarchy
// ----------------------------------------------------------------------------

export interface Country {
  id: string; // ISO 3166-1 alpha-2, e.g. 'CZ'
  name: string;
  slug: string;
  currency_code: string;
  default_locale: string;
  phone_prefix: string;
  bounds_north?: number;
  bounds_south?: number;
  bounds_east?: number;
  bounds_west?: number;
  center_latitude: number;
  center_longitude: number;
  is_active: boolean;
  created_at?: string;
}

export interface Region {
  id: string; // e.g. 'cz-pha'
  country_id: string;
  code: string; // 'PHA', 'JHM'
  name: string; // 'Hlavní město Praha'
  short_name: string; // 'Praha'
  slug: string;
  latitude: number;
  longitude: number;
  zoom_level: number;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface City {
  id: string; // e.g. 'praha'
  region_id: string;
  name: string;
  slug: string;
  postal_code_prefix?: string;
  latitude: number;
  longitude: number;
  is_major: boolean;
  sauna_count: number;
  created_at?: string;
}

// ----------------------------------------------------------------------------
// 2. Users & Authentication
// ----------------------------------------------------------------------------

export type UserRole = 'user' | 'partner' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  display_name: string;
  avatar_url?: string | null;
  role: UserRole;
  bio?: string | null;
  preferred_region_id?: string | null;
  is_email_verified: boolean;
  reviews_count: number;
  helpful_votes_received: number;
  created_at?: string;
  updated_at?: string;
}

export type UserPublicProfile = Omit<User, 'password_hash' | 'email'> & {
  email?: string; // only self
};

export interface AuthSession {
  user: UserPublicProfile;
  token: string;
}

// ----------------------------------------------------------------------------
// 3. Catalogs (Cooling, Sauna Types, Amenities)
// ----------------------------------------------------------------------------

export interface CoolingOption {
  id: CoolingOptionCode | string;
  name_cz: string;
  name_en: string;
  category: 'plunge_pool' | 'natural_water' | 'ice' | 'shower' | 'special';
  icon_name: string;
  description: string;
}

export interface VenueCoolingOption {
  id: string;
  venue_id: string;
  cooling_option_id: string;
  water_temperature_celsius?: number | null;
  description?: string | null;
  is_featured: boolean;
  cooling_option?: CoolingOption;
}

export interface SaunaType {
  id: SaunaTypeCode | string;
  name_cz: string;
  name_en: string;
  default_temp_celsius: number;
  default_humidity_percentage: number;
  icon_name: string;
  description: string;
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
  stove_type?: string | null;
  features?: string[] | null;
  description?: string | null;
  photo_url?: string | null;
  sauna_type?: SaunaType;
}

export interface AmenityFacility {
  id: string;
  name_cz: string;
  name_en: string;
  icon_name: string;
  description: string;
}

export interface VenueAmenity {
  id: string;
  venue_id: string;
  amenity_id: string;
  quantity: number;
  description?: string | null;
  amenity?: AmenityFacility;
}

// ----------------------------------------------------------------------------
// 4. MultiSport Rules & Operating Policies
// ----------------------------------------------------------------------------

export interface VenueMultisportRule {
  venue_id: string;
  is_accepted: boolean;
  benefit_type: MultisportBenefitTypeCode;
  time_limit_minutes?: number | null;
  discount_amount_czk?: number | null;
  discount_percentage?: number | null;
  entry_surcharge_czk?: number | null;
  overtime_surcharge_per_block_czk?: number | null;
  overtime_block_minutes?: number | null;
  included_zones: string;
  towel_sheet_service_included: boolean;
  valid_days: MultisportValidDaysCode;
  valid_hours_description: string;
  accepted_card_types: string[]; // parsed from JSON string in DB
  note?: string | null;
  last_verified_at?: string;
}

export interface VenueOperatingPolicy {
  venue_id: string;
  access_type: OperatingAccessTypeCode;
  nudity_policy: NudityPolicyCode;
  women_only_policy: 'none' | 'dedicated_days' | 'dedicated_hours' | 'dedicated_private_zone';
  women_only_schedule_note?: string | null;
  men_only_schedule_note?: string | null;
  children_policy: 'adults_only' | 'children_welcome' | 'family_hours';
  children_min_age?: number | null;
  barrier_free_access: 'full' | 'partial' | 'no';
  parking_policy: 'free_onsite' | 'paid_onsite' | 'street_public' | 'no_parking';
  parking_notes?: string | null;
  refreshment_type: 'sauna_bar_full' | 'bistro_restaurant' | 'vending_water_only' | 'water_station_free' | 'none';
  towels_and_sheets: 'included_free' | 'rental_fee' | 'bring_own';
}

export interface VenueOpeningHours {
  id: string;
  venue_id: string;
  day_of_week: number; // 0 = Mon, 6 = Sun
  open_time: string; // '10:00'
  close_time: string; // '22:00'
  is_closed: boolean;
  special_note?: string | null;
}

export interface VenuePricing {
  id: string;
  venue_id: string;
  ticket_name: string;
  duration_minutes?: number | null; // null = unlimited
  price_czk: number;
  price_student_czk?: number | null;
  price_senior_czk?: number | null;
  is_default: boolean;
  note?: string | null;
}

// ----------------------------------------------------------------------------
// 5. Core Sauna Venue Models
// ----------------------------------------------------------------------------

export type VenueStatus = 'active' | 'pending_approval' | 'temporarily_closed' | 'permanently_closed';
export type PromotedTier = 'basic' | 'featured' | 'premium';

export interface SaunaVenue {
  id: string;
  city_id: string;
  region_id: string;
  country_id: string;
  name: string;
  slug: string;
  category: VenueCategoryCode;
  short_description: string;
  description: string;

  address_street: string;
  address_city: string;
  address_zip: string;
  latitude: number;
  longitude: number;

  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  booking_url?: string | null;

  cover_image_url: string;
  gallery_urls?: string[]; // parsed from JSON array

  // Fast booleans
  has_plunge_pool: boolean;
  has_outdoor_cooling: boolean;
  has_natural_water: boolean;
  has_ice_well: boolean;
  has_bucket_shower: boolean;
  has_experience_showers: boolean;
  has_ceremonial_hall: boolean;
  has_whirlpool: boolean;
  has_steam_bath: boolean;
  has_herbal_sauna: boolean;
  has_private_rental: boolean;

  // Aggregate ratings (ČSFD style)
  rating_overall: number;
  rating_cleanliness: number;
  rating_heat_steam: number;
  rating_cooling: number;
  rating_staff_ceremonies: number;
  rating_value: number;
  review_count: number;
  favorite_count: number;

  // B2B and promotion
  is_promoted: boolean;
  promoted_badge?: string | null;
  promoted_tier?: PromotedTier | null;
  promoted_until?: string | null;
  claimed_by_user_id?: string | null;
  claimed_at?: string | null;
  is_verified_partner: boolean;

  status: VenueStatus;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lightweight sauna model for search results, recommendation cards, and lists
 */
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

  // Fast flags
  has_plunge_pool: boolean;
  has_outdoor_cooling: boolean;
  has_natural_water: boolean;
  has_ceremonial_hall: boolean;
  has_whirlpool: boolean;

  // MultiSport summary
  multisport?: {
    is_accepted: boolean;
    benefit_type: MultisportBenefitTypeCode;
    time_limit_minutes?: number | null;
    discount_amount_czk?: number | null;
    entry_surcharge_czk?: number | null;
    badge_label?: string;
  };

  // Ratings
  rating_overall: number;
  review_count: number;
  favorite_count: number;

  // Promotion
  is_promoted: boolean;
  promoted_badge?: string | null;

  // Proximity (calculated dynamically when GPS is supplied)
  distance_km?: number;
}

/**
 * Full detailed venue with all relational child entities loaded
 */
export interface SaunaDetail extends SaunaVenue {
  multisport?: VenueMultisportRule | null;
  policies?: VenueOperatingPolicy | null;
  cooling_options: VenueCoolingOption[];
  saunas: VenueSauna[];
  amenities: VenueAmenity[];
  opening_hours: VenueOpeningHours[];
  pricing: VenuePricing[];
  reviews: Review[];
  ceremonies: SaunaCeremony[];
  distance_km?: number;
}

// ----------------------------------------------------------------------------
// 6. Reviews & Ratings (ČSFD Style)
// ----------------------------------------------------------------------------

export interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  rating_overall: number; // 1-5
  rating_cleanliness: number; // 1-5
  rating_heat_steam: number; // 1-5
  rating_cooling: number; // 1-5
  rating_staff_ceremonies: number; // 1-5
  rating_value: number; // 1-5
  title: string;
  content: string;
  tips?: string | null;
  recommended_time?: string | null;
  visit_date?: string | null;
  is_verified_visit: boolean;
  helpful_votes_count: number;
  status: 'published' | 'hidden' | 'flagged';
  created_at?: string;
  updated_at?: string;
  user?: UserPublicProfile;
  photos?: ReviewPhoto[];
}

export interface ReviewPhoto {
  id: string;
  review_id: string;
  venue_id: string;
  user_id: string;
  photo_url: string;
  caption?: string | null;
  is_approved: boolean;
  created_at?: string;
}

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  created_at?: string;
}

// ----------------------------------------------------------------------------
// 7. User Saved Lists
// ----------------------------------------------------------------------------

export interface UserVenueListEntry {
  id: string;
  user_id: string;
  venue_id: string;
  list_type: UserListTypeCode;
  visited_at?: string | null;
  personal_notes?: string | null;
  created_at?: string;
  venue?: SaunaSummary;
}

// ----------------------------------------------------------------------------
// 8. Community Proposals & Suggestions
// ----------------------------------------------------------------------------

export interface VenueSuggestion {
  id: string;
  user_id?: string | null;
  submitter_name: string;
  submitter_email: string;
  venue_name: string;
  category: string;
  street_address: string;
  city: string;
  region_id: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
  phone?: string | null;
  multisport_accepted: boolean;
  multisport_details?: string | null;
  sauna_types?: string[] | null;
  cooling_options?: string[] | null;
  description?: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  moderator_id?: string | null;
  moderator_comment?: string | null;
  created_venue_id?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
}

// ----------------------------------------------------------------------------
// 9. B2B Claims, Ceremonies, Affiliates
// ----------------------------------------------------------------------------

export interface VenueClaim {
  id: string;
  venue_id: string;
  user_id: string;
  business_name: string;
  ico: string; // Czech Business ID
  applicant_name: string;
  applicant_role: string;
  official_email: string;
  official_phone: string;
  billing_address?: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_method: string;
  verification_notes?: string | null;
  created_at?: string;
  verified_at?: string | null;
  verified_by_user_id?: string | null;
  venue?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SaunaCeremony {
  id: string;
  venue_id: string;
  title: string;
  category: CeremonyCategoryCode;
  description: string;
  ceremony_master?: string | null;
  hall_name?: string | null;
  day_of_week?: number | null; // 0-6
  is_recurring: boolean;
  recurrence_pattern?: string | null;
  start_time: string; // '18:00'
  end_time: string; // '18:20'
  event_date?: string | null; // YYYY-MM-DD
  special_entry_fee_czk: number;
  is_featured: boolean;
  created_at?: string;
  venue_name?: string;
  venue_slug?: string;
}

export interface AffiliatePartnerProduct {
  id: string;
  category: 'sauna_hats' | 'essential_oils' | 'kilts_towels' | 'peelings' | 'thermometers_accessories';
  product_name: string;
  partner_shop_name: string;
  image_url: string;
  price_czk: number;
  affiliate_url: string;
  description?: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
}

export interface PartnerReferralClick {
  id: string;
  venue_id?: string | null;
  affiliate_product_id?: string | null;
  click_type: 'venue_booking_url' | 'venue_website' | 'affiliate_product';
  user_agent?: string | null;
  referrer?: string | null;
  clicked_at?: string;
}

// ----------------------------------------------------------------------------
// 10. Map Markers & Filter Query Parameters
// ----------------------------------------------------------------------------

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

export interface SaunaFilterParams {
  q?: string; // Text search query
  category?: VenueCategoryCode;
  benefit_type?: MultisportBenefitTypeCode;
  min_time_limit?: number;
  cooling?: CoolingOptionCode | string;
  sauna_type?: SaunaTypeCode | string;
  nudity_policy?: NudityPolicyCode;
  region_id?: string;
  city_id?: string;
  lat?: number;
  lon?: number;
  radius_km?: number;
  sort?: 'recommended' | 'rating' | 'distance' | 'reviews' | 'name';
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    count?: number;
    total?: number;
    suggestedRelaxations?: string[];
    [key: string]: unknown;
  };
}
