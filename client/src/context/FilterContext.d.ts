import React from 'react';
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
export declare const FilterProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useFilters: () => FilterContextType;
export {};
