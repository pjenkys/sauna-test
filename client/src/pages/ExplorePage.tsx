import React, { useState, useEffect, useCallback } from 'react';
import { FilterSidebar } from '../components/FilterSidebar';
import { SaunaCard } from '../components/SaunaCard';
import { SaunaMap } from '../components/SaunaMap';
import { ViewToggle } from '../components/ViewToggle';
import { ZeroState } from '../components/ZeroState';
import { useFilters } from '../context/FilterContext';
import { useLocation } from '../context/LocationContext';
import { api, GetSaunasParams } from '../services/api';
import { SaunaSummary, MapMarker } from '../types';

interface ExplorePageProps {
  navigate: (path: string) => void;
  initialQuery?: string;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ navigate }) => {
  const { filters, setSort } = useFilters();
  const { location } = useLocation();

  const [saunas, setSaunas] = useState<SaunaSummary[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [suggestedRelaxations, setSuggestedRelaxations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [view, setView] = useState<'all' | 'list' | 'map'>('all');
  const [displayLimit, setDisplayLimit] = useState<number>(12);

  // Fetch saunas according to current filters & user location
  const fetchSaunas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: GetSaunasParams = {
        q: filters.q.trim() || undefined,
        category: filters.category || undefined,
        benefit_type: filters.benefit_type || undefined,
        time_limit: filters.time_limit !== null ? filters.time_limit : undefined,
        cooling: filters.cooling || undefined,
        sauna_type: filters.sauna_type || undefined,
        nudity_policy: filters.nudity_policy || undefined,
        region_id: filters.region_id || undefined,
        has_ceremonial_hall: filters.has_ceremonial_hall || undefined,
        sort: filters.sort,
        lat: location.lat,
        lon: location.lon,
      };

      const res = await api.getSaunas(params);
      if (res.success && res.data) {
        setSaunas(res.data);
        setTotalCount(res.meta?.count ?? res.data.length);
        setSuggestedRelaxations(res.meta?.suggestedRelaxations || []);

        const mapItems: MapMarker[] = res.data.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          category: s.category,
          latitude: s.latitude,
          longitude: s.longitude,
          rating_overall: s.rating_overall,
          review_count: s.review_count,
          is_promoted: s.is_promoted,
          promoted_badge: s.promoted_badge,
          address_city: s.address_city,
          multisport_benefit: s.multisport?.benefit_type,
        }));
        setMarkers(mapItems);
      }
    } catch (err) {
      console.error('Error fetching filtered saunas', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, location.lat, location.lon]);

  useEffect(() => {
    fetchSaunas();
  }, [fetchSaunas]);

  return (
    <div className="flex relative">
      <FilterSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        totalResults={totalCount}
      />

      <main className="flex-1 min-w-0 px-4 lg:px-6 py-6">
        {/* Title, Count, Mobile Filter Trigger, ViewToggle */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl text-foreground leading-tight">
                Katalog saun a wellness v ČR
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Nalezeno{' '}
                <span className="font-semibold text-foreground">{totalCount}</span>{' '}
                kouzelných míst dle vašich kritérií
              </p>
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium bg-card shadow-sm hover:border-primary/50 transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4 text-primary"
              >
                <path d="M3 6h18M7 12h10M11 18h2" />
              </svg>
              Filtry
            </button>
          </div>

          <div className="mt-4">
            <ViewToggle
              view={view}
              onViewChange={setView}
              sort={filters.sort}
              onSortChange={(newSort) => setSort(newSort as any)}
            />
          </div>
        </div>

        {/* Map: shown when view is 'all' or 'map' */}
        {(view === 'all' || view === 'map') && (
          <div className="mb-6 rounded-xl overflow-hidden border border-border shadow-sm">
            <SaunaMap
              markers={markers}
              center={
                location.lat && location.lon
                  ? [location.lat, location.lon]
                  : [49.8175, 15.473]
              }
              zoom={location.lat ? 10 : 7}
              onSelectSauna={(slug) => navigate(`/sauna/${slug}`)}
              className={view === 'map' ? 'h-[640px] w-full' : 'h-[380px] w-full'}
            />
          </div>
        )}

        {/* Venue Cards Grid: shown when view is 'all' or 'list' */}
        {(view === 'all' || view === 'list') && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 rounded-xl bg-card border border-border" />
                ))}
              </div>
            ) : saunas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {saunas.slice(0, displayLimit).map((sauna) => (
                  <SaunaCard
                    key={sauna.id}
                    sauna={sauna}
                    onClick={() => navigate(`/sauna/${sauna.slug}`)}
                  />
                ))}
              </div>
            ) : (
              <ZeroState suggestedRelaxations={suggestedRelaxations} />
            )}
          </>
        )}

        {/* Pagination / Load more footer */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>
            Zobrazeno {Math.min(displayLimit, saunas.length)} z {totalCount} výsledků
          </span>
          {displayLimit < saunas.length && (
            <button
              onClick={() => setDisplayLimit((prev) => prev + 12)}
              className="px-6 py-2.5 border border-border rounded-full hover:border-primary/60 hover:text-primary transition-colors text-sm cursor-pointer"
            >
              Načíst další
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
