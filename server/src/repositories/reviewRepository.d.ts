import { DatabaseSync } from 'node:sqlite';
import type { Review } from '@shared';
export interface CreateReviewData {
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
    is_verified_visit?: boolean;
}
export declare class ReviewRepository {
    private db;
    constructor(customDb?: DatabaseSync);
    findByVenueId(venueId: string, limit?: number, offset?: number): Review[];
    findById(id: string): Review | null;
    create(data: CreateReviewData): Review;
    voteHelpful(reviewId: string, userId: string): boolean;
    recalculateVenueRatings(venueId: string): {
        overall: number;
        count: number;
    };
    private mapRowToReview;
}
export declare const reviewRepository: ReviewRepository;
