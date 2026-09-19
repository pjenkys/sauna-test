import type { SaunaSummary, SaunaDetail, MapMarker, User, Review, UserListsState, SaunaCeremony, AffiliatePartnerProduct } from '../types';
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
export declare const api: {
    getSaunas(params?: GetSaunasParams): Promise<GetSaunasResponse>;
    getSaunaDetail(slugOrId: string): Promise<{
        success: boolean;
        data: SaunaDetail;
    }>;
    getRecommendations(lat: number, lon: number, limit?: number): Promise<{
        success: boolean;
        data: SaunaSummary[];
    }>;
    getMapMarkers(): Promise<{
        success: boolean;
        data: MapMarker[];
    }>;
    login(credentials: {
        email: string;
        password: string;
    }): Promise<AuthResponse>;
    register(data: {
        email: string;
        password: string;
        display_name: string;
    }): Promise<AuthResponse>;
    getMe(): Promise<{
        success: boolean;
        user: User;
    }>;
    getReviews(venueId: string): Promise<{
        success: boolean;
        data: Review[];
    }>;
    createReview(data: ReviewInput): Promise<{
        success: boolean;
        review: Review;
    }>;
    voteReviewHelpful(reviewId: string): Promise<{
        success: boolean;
    }>;
    getUserLists(): Promise<{
        success: boolean;
        data: UserListsState;
    }>;
    addToList(data: {
        venue_id: string;
        list_type: "favorite" | "want_to_visit" | "visited";
        visited_at?: string;
        personal_notes?: string;
    }): Promise<{
        success: boolean;
    }>;
    removeFromList(venueId: string, listType?: string): Promise<{
        success: boolean;
    }>;
    submitClaim(data: ClaimInput): Promise<{
        success: boolean;
        claim_id: string;
    }>;
    submitSuggestion(data: SuggestionInput): Promise<{
        success: boolean;
        suggestion_id: string;
    }>;
    getCeremonies(params?: {
        venue_id?: string;
        category?: string;
        day_of_week?: number;
    }): Promise<{
        success: boolean;
        data: SaunaCeremony[];
    }>;
    getAffiliateProducts(): Promise<{
        success: boolean;
        data: AffiliatePartnerProduct[];
    }>;
    trackReferralClick(data: {
        venue_id?: string;
        affiliate_product_id?: string;
        click_type: "venue_booking_url" | "venue_website" | "affiliate_product";
        destination_url?: string;
    }): Promise<void>;
};
