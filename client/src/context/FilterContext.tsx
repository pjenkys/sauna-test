import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export interface FilterState {
  q: string;
  category: string;
  benefit_type: string;
  time_limit: number | null;
  cooling: string;
  sauna_type: string;
  nudity_policy: string;
  region_id: string;
  has_ceremonial_hall: boolean;
  sort: 'recommended' | 'rating' | 'distance' | 'reviews' | 'name';
}

const initialFilters: FilterState = {
  q: '',
  category: '',
  benefit_type: '',
  time_limit: null,
  cooling: '',
  sauna_type: '',
  nudity_policy: '',
  region_id: '',
  has_ceremonial_hall: false,
  sort: 'recommended',
};

interface FilterContextType {
  filters: FilterState;
  activeFiltersCount: number;
  setSearchQuery: (q: string) => void;
  setCategory: (category: string) => void;
  setBenefitType: (benefit_type: string) => void;
  setTimeLimit: (limit: number | null) => void;
  setCooling: (cooling: string) => void;
  setSaunaType: (sauna_type: string) => void;
  setNudityPolicy: (policy: string) => void;
  setRegionId: (region_id: string) => void;
  setHasCeremonialHall: (has: boolean) => void;
  setSort: (sort: FilterState['sort']) => void;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  relaxSuggestedFilters: (suggestedKeys?: string[]) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.q.trim()) count++;
    if (filters.category) count++;
    if (filters.benefit_type) count++;
    if (filters.time_limit !== null) count++;
    if (filters.cooling) count++;
    if (filters.sauna_type) count++;
    if (filters.nudity_policy) count++;
    if (filters.region_id) count++;
    if (filters.has_ceremonial_hall) count++;
    return count;
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setSearchQuery = useCallback((q: string) => updateFilter('q', q), [updateFilter]);
  const setCategory = useCallback((category: string) => updateFilter('category', category), [updateFilter]);
  const setBenefitType = useCallback((benefit_type: string) => updateFilter('benefit_type', benefit_type), [updateFilter]);
  const setTimeLimit = useCallback((time_limit: number | null) => updateFilter('time_limit', time_limit), [updateFilter]);
  const setCooling = useCallback((cooling: string) => updateFilter('cooling', cooling), [updateFilter]);
  const setSaunaType = useCallback((sauna_type: string) => updateFilter('sauna_type', sauna_type), [updateFilter]);
  const setNudityPolicy = useCallback((nudity_policy: string) => updateFilter('nudity_policy', nudity_policy), [updateFilter]);
  const setRegionId = useCallback((region_id: string) => updateFilter('region_id', region_id), [updateFilter]);
  const setHasCeremonialHall = useCallback((has: boolean) => updateFilter('has_ceremonial_hall', has), [updateFilter]);
  const setSort = useCallback((sort: FilterState['sort']) => updateFilter('sort', sort), [updateFilter]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const relaxSuggestedFilters = useCallback((suggestedKeys?: string[]) => {
    if (!suggestedKeys || suggestedKeys.length === 0) {
      resetFilters();
      return;
    }
    setFilters((prev) => {
      const next = { ...prev };
      suggestedKeys.forEach((key) => {
        if (key === 'time_limit') next.time_limit = null;
        else if (key === 'has_ceremonial_hall') next.has_ceremonial_hall = false;
        else if (key in next) {
          (next as any)[key] = '';
        }
      });
      return next;
    });
  }, [resetFilters]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        activeFiltersCount,
        setSearchQuery,
        setCategory,
        setBenefitType,
        setTimeLimit,
        setCooling,
        setSaunaType,
        setNudityPolicy,
        setRegionId,
        setHasCeremonialHall,
        setSort,
        updateFilter,
        resetFilters,
        relaxSuggestedFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
