import React, { useState } from 'react';

export const SORT_OPTIONS: Record<string, string> = {
  recommended: 'Doporučené & Partneři',
  rating: 'Hodnocení',
  distance: 'Vzdálenost',
  newest: 'Nejnovější',
};

interface ViewToggleProps {
  view: 'all' | 'list' | 'map';
  onViewChange: (view: 'all' | 'list' | 'map') => void;
  sort: string;
  onSortChange: (sort: string) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  view,
  onViewChange,
  sort,
  onSortChange,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5 bg-card">
        <button
          type="button"
          onClick={() => onViewChange('all')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            view === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          Vše
        </button>
        <button
          type="button"
          onClick={() => onViewChange('list')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            view === 'list'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Seznam
        </button>
        <button
          type="button"
          onClick={() => onViewChange('map')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            view === 'map'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          Pouze mapa
        </button>
      </div>

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-foreground bg-card hover:border-primary/50 transition-colors shadow-sm cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-muted-foreground">
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          <span>{SORT_OPTIONS[sort] || sort}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            {Object.entries(SORT_OPTIONS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onSortChange(key);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                  sort === key
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
