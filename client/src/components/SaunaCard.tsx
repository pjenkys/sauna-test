import React from 'react';
import { SaunaSummary, VENUE_CATEGORY_LABELS, MULTISPORT_BENEFIT_LABELS } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useLocation } from '../context/LocationContext';

import { getDiverseSaunaPhoto } from '../utils/saunaImages';

interface SaunaCardProps {
  sauna: SaunaSummary;
  onClick: () => void;
}

export const SaunaCard: React.FC<SaunaCardProps> = ({ sauna, onClick }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getDistanceTo } = useLocation();

  const favorite = isFavorite(sauna.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(sauna);
  };

  const catInfo = VENUE_CATEGORY_LABELS[sauna.category];
  const msInfo = sauna.multisport?.benefit_type
    ? MULTISPORT_BENEFIT_LABELS[sauna.multisport.benefit_type]
    : null;

  // Calculate dynamic distance or use formatted distance
  const liveDist = sauna.distance_formatted || (getDistanceTo(sauna.latitude, sauna.longitude)?.formatted) || 'ČR';

  // Address
  const address = [sauna.address_street, sauna.address_city].filter(Boolean).join(', ');

  const initialImg = sauna.cover_image_url || getDiverseSaunaPhoto(sauna.id || sauna.name);

  return (
    <article
      onClick={onClick}
      className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <img
          src={initialImg}
          alt={sauna.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getDiverseSaunaPhoto(sauna.id || sauna.name);
          }}
        />

        {/* Top-left Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="text-[11px] text-foreground/80 bg-card/85 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {liveDist}
          </span>
          {sauna.is_promoted && (
            <span className="text-[11px] text-primary font-medium bg-card/85 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-accent">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Doporučeno / Partner
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-card/85 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer"
          aria-label={favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
        >
          <svg
            viewBox="0 0 24 24"
            fill={favorite ? '#C4622D' : 'none'}
            stroke={favorite ? '#C4622D' : 'currentColor'}
            strokeWidth="2"
            className="w-4 h-4"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>

        {/* Category gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/70 to-transparent px-3 py-3">
          <span className="text-[11px] text-white/90">
            {catInfo?.cz || sauna.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <svg viewBox="0 0 24 24" fill="#E8A87C" className="w-3.5 h-3.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-sm font-semibold text-foreground">
            {(sauna.rating_overall > 0 ? sauna.rating_overall : 5.0).toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({sauna.review_count > 0 ? sauna.review_count : 1})
          </span>
        </div>

        <h3 className="font-display text-lg leading-snug text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {sauna.name}
        </h3>

        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{address}</span>
        </p>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
          {sauna.short_description}
        </p>

        {msInfo && (
          <div className="pt-2.5 border-t border-border flex items-center justify-between">
            <span className="text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-md">
              {sauna.multisport?.entry_surcharge_czk
                ? `MultiSport (+${sauna.multisport.entry_surcharge_czk} Kč)`
                : sauna.multisport?.time_limit_minutes
                ? `MultiSport (${sauna.multisport.time_limit_minutes} min)`
                : msInfo.badge}
            </span>
            <span className="text-xs text-primary font-medium group-hover:underline">
              Detail &rarr;
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
