import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserListsState, UserListTypeCode, SaunaSummary } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  lists: UserListsState;
  isLoading: boolean;
  isFavorite: (venueId: string) => boolean;
  isWantToVisit: (venueId: string) => boolean;
  isVisited: (venueId: string) => boolean;
  toggleFavorite: (venue: SaunaSummary | { id: string; name?: string; slug?: string; category?: any }) => Promise<void>;
  toggleList: (
    venue: SaunaSummary | { id: string; name?: string; slug?: string; category?: any },
    listType: UserListTypeCode
  ) => Promise<void>;
  refreshLists: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'saunuj_guest_lists';

const initialListsState: UserListsState = {
  favorite: [],
  want_to_visit: [],
  visited: [],
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState<UserListsState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return initialListsState;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshLists = useCallback(async () => {
    if (!user) {
      // Load from local storage
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) setLists(JSON.parse(saved));
      } catch {
        // Ignore
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.getUserLists();
      if (res.success && res.data) {
        setLists({
          favorite: res.data.favorite || [],
          want_to_visit: res.data.want_to_visit || [],
          visited: res.data.visited || [],
        });
      }
    } catch (err) {
      console.error('Failed to load user lists', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  const isFavorite = useCallback(
    (venueId: string) => lists.favorite.some((item) => (item.id || (item as any).venue_id) === venueId),
    [lists.favorite]
  );

  const isWantToVisit = useCallback(
    (venueId: string) => lists.want_to_visit.some((item) => (item.id || (item as any).venue_id) === venueId),
    [lists.want_to_visit]
  );

  const isVisited = useCallback(
    (venueId: string) => lists.visited.some((item) => (item.id || (item as any).venue_id) === venueId),
    [lists.visited]
  );

  const toggleList = useCallback(
    async (
      venue: SaunaSummary | { id: string; name?: string; slug?: string; category?: any },
      listType: UserListTypeCode
    ) => {
      const venueId = venue.id;
      const currentList = lists[listType];
      const exists = currentList.some((item) => (item.id || (item as any).venue_id) === venueId);

      // Optimistic update
      let updatedList: any[];
      if (exists) {
        updatedList = currentList.filter((item) => (item.id || (item as any).venue_id) !== venueId);
      } else {
        const newEntry = {
          list_entry_id: `local_${Date.now()}`,
          id: venue.id,
          venue_id: venue.id,
          name: venue.name || 'Sauna',
          slug: venue.slug || venue.id,
          category: venue.category || 'public',
          address_city: (venue as any).address_city || '',
          cover_image_url: (venue as any).cover_image_url || '',
          rating_overall: (venue as any).rating_overall || 0,
          review_count: (venue as any).review_count || 0,
          list_type: listType,
          added_at: new Date().toISOString(),
        };
        updatedList = [newEntry, ...currentList];
      }

      const newListsState = { ...lists, [listType]: updatedList };
      setLists(newListsState);

      if (!user) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newListsState));
        } catch {
          // Ignore
        }
        return;
      }

      // Sync with server if logged in
      try {
        if (exists) {
          await api.removeFromList(venueId, listType);
        } else {
          await api.addToList({ venue_id: venueId, list_type: listType });
        }
        await refreshLists();
      } catch (err) {
        console.error('Error syncing list with backend', err);
        // Rollback on failure
        refreshLists();
      }
    },
    [lists, user, refreshLists]
  );

  const toggleFavorite = useCallback(
    async (venue: SaunaSummary | { id: string; name?: string; slug?: string; category?: any }) => {
      return toggleList(venue, 'favorite');
    },
    [toggleList]
  );

  return (
    <FavoritesContext.Provider
      value={{
        lists,
        isLoading,
        isFavorite,
        isWantToVisit,
        isVisited,
        toggleFavorite,
        toggleList,
        refreshLists,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
