import React from 'react';
import { UserListsState, UserListTypeCode, SaunaSummary } from '../types';
interface FavoritesContextType {
    lists: UserListsState;
    isLoading: boolean;
    isFavorite: (venueId: string) => boolean;
    isWantToVisit: (venueId: string) => boolean;
    isVisited: (venueId: string) => boolean;
    toggleFavorite: (venue: SaunaSummary | {
        id: string;
        name?: string;
        slug?: string;
        category?: any;
    }) => Promise<void>;
    toggleList: (venue: SaunaSummary | {
        id: string;
        name?: string;
        slug?: string;
        category?: any;
    }, listType: UserListTypeCode) => Promise<void>;
    refreshLists: () => Promise<void>;
}
export declare const FavoritesProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useFavorites: () => FavoritesContextType;
export {};
