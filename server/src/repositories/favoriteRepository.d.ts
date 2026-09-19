import { DatabaseSync } from 'node:sqlite';
import type { UserVenueListEntry, UserListTypeCode } from '@shared';
export declare class FavoriteRepository {
    private db;
    constructor(customDb?: DatabaseSync);
    getUserList(userId: string, listType?: UserListTypeCode): UserVenueListEntry[];
    addToList(userId: string, venueId: string, listType: UserListTypeCode, notes?: string, visitedAt?: string): UserVenueListEntry;
    removeFromList(userId: string, venueId: string, listType: UserListTypeCode): boolean;
    isVenueInUserList(userId: string, venueId: string, listType: UserListTypeCode): boolean;
    recalculateVenueFavoriteCount(venueId: string): number;
}
export declare const favoriteRepository: FavoriteRepository;
