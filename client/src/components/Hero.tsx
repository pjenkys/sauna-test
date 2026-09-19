import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Navigation, ArrowRight, Sparkles, Crosshair } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { api } from '../services/api';
import { SaunaSummary, VENUE_CATEGORY_LABELS, MULTISPORT_BENEFIT_LABELS } from '../types';

interface HeroProps {
  navigate: (path: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ navigate }) => {
  const { location, requestGeolocation, isLocating } = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendations, setRecommendations] = useState<SaunaSummary[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (location.lat && location.lon) {
      setIsLoadingRecs(true);
      api
        .getRecommendations(location.lat, location.lon, 3)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setRecommendations(res.data);
          }
        })
        .catch((err) => {
          console.error('Error fetching recommendations', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingRecs(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [location.lat, location.lon]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#FAF8F5]">
      {/* 1. Immersive Atmospheric Hero Banner */}
      <div className="relative min-h-[520px] lg:min-h-[560px] flex items-center justify-center bg-stone-900 text-white px-4 py-16 sm:py-20">
        {/* Background Image with Cinematic Lighting */}
        <img
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=85"
          alt="Kouzelná sauna v přírodě"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-65"
        />
        {/* Gradient overlays for warm boutique blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-black/40 to-black/35" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Boutique Editorial Top Assist Chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-medium tracking-wide mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kurátorský průvodce saunami a wellness v ČR</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.18] mb-5 drop-shadow-md">
            Objevte nejkouzelnější saunová místa v Česku
          </h1>

          <p className="font-sans text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed mb-8 max-w-2xl mx-auto font-light drop-shadow">
            Katalog finských, bylinkových i zážitkových saun s ceremoniály.
            Kompletní a ověřené podmínky karty MultiSport a ochlazovacích bazénků.
          </p>

          {/* Figma Pill Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 sm:p-2 bg-card rounded-2xl sm:rounded-full shadow-md border border-border max-w-2xl mx-auto text-foreground"
          >
            <div className="relative flex-1 w-full flex items-center pl-4 sm:pl-5">
              <Search className="w-4 h-4 text-primary shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Hledat saunu, město, kraje, biotop či Infinit..."
                className="w-full bg-transparent pl-3 pr-4 py-3 text-base sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none font-sans"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Hledat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Boutique Quick Filter Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-white/80 text-[11px] font-light mr-1">Doporučené filtry:</span>
            <button
              type="button"
              onClick={() => navigate('/explore?cooling=indoor_plunge_pool')}
              className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-stone-900 backdrop-blur-md border border-white/30 text-xs font-medium transition-all cursor-pointer shadow-sm"
            >
              Ochlazovací bazének
            </button>
            <button
              type="button"
              onClick={() => navigate('/explore?benefit_type=free_time_limited')}
              className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-stone-900 backdrop-blur-md border border-white/30 text-xs font-medium transition-all cursor-pointer shadow-sm"
            >
              MultiSport zdarma
            </button>
            <button
              type="button"
              onClick={() => navigate('/explore?category=wellness_ceremonial')}
              className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-stone-900 backdrop-blur-md border border-white/30 text-xs font-medium transition-all cursor-pointer shadow-sm"
            >
              Zážitkové ceremoniály
            </button>
            <button
              type="button"
              onClick={() => navigate('/explore?category=private')}
              className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-stone-900 backdrop-blur-md border border-white/30 text-xs font-medium transition-all cursor-pointer shadow-sm"
            >
              Privátní sauny
            </button>
          </div>
        </div>
      </div>

      {/* 2. Geolocation Recommendations: Boutique Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8C3A27] uppercase tracking-wider mb-1.5">
              <Navigation className="w-3.5 h-3.5" />
              <span>Doporučení dle vaší polohy</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-stone-900 tracking-tight">
              Saunové oázy ve vašem okolí
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-light mt-1.5">
              <span>Vypočteno pro: <strong className="text-stone-800 font-medium">{location.label}</strong></span>
              <span>•</span>
              <button
                type="button"
                onClick={requestGeolocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1 text-[#C26747] hover:underline font-medium cursor-pointer"
              >
                <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                {isLocating ? 'Zjišťuji GPS...' : 'Aktualizovat GPS polohu'}
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#EAE2D5] text-xs font-medium text-stone-800 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <span>Zobrazit všech 320+ saun</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
          </button>
        </div>

        {isLoadingRecs ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-3xl bg-white border border-[#EAE2D5]" />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((sauna) => {
              const catInfo = VENUE_CATEGORY_LABELS[sauna.category];
              const msInfo = sauna.multisport?.benefit_type
                ? MULTISPORT_BENEFIT_LABELS[sauna.multisport.benefit_type]
                : null;

              return (
                <div
                  key={sauna.id}
                  onClick={() => navigate(`/sauna/${sauna.slug}`)}
                  className="group relative bg-card border border-border hover:border-primary/50 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg shadow-sm cursor-pointer flex flex-col justify-between"
                >
                  {/* Photo & Badges */}
                  <div className="relative h-52 w-full overflow-hidden bg-muted/40">
                    <img
                      src={sauna.cover_image_url}
                      alt={sauna.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Distance Pill */}
                    {sauna.distance_formatted && (
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-card/85 backdrop-blur-sm text-foreground text-[11px] font-medium flex items-center gap-1 shadow-sm">
                        <Navigation className="w-3 h-3 text-primary" />
                        <span>{sauna.distance_formatted}</span>
                      </div>
                    )}

                    {/* Promoted / Partner Badge */}
                    {sauna.is_promoted && (
                      <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-card/85 backdrop-blur-sm text-primary text-[11px] font-medium flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3 text-accent" />
                        <span>{sauna.promoted_badge || 'Výběr kurátora'}</span>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[11px] text-white/90 font-medium">
                        {catInfo?.cz || sauna.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {sauna.name}
                        </h3>
                        <div className="flex items-center gap-1 text-foreground text-xs font-semibold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-[#e8a87c] text-[#e8a87c]" />
                          <span>{sauna.rating_overall > 0 ? sauna.rating_overall.toFixed(1) : '5.0'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{sauna.address_city}</span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {sauna.short_description}
                      </p>
                    </div>

                    <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs">
                      {msInfo ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {sauna.multisport?.time_limit_minutes
                            ? `MultiSport (${sauna.multisport.time_limit_minutes} min)`
                            : sauna.multisport?.entry_surcharge_czk
                            ? `Doplatek ${sauna.multisport.entry_surcharge_czk} Kč`
                            : msInfo.badge}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Bez MultiSportu</span>
                      )}

                      <span className="text-xs font-medium text-primary group-hover:underline flex items-center gap-1">
                        Detail
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-center text-on-surface-variant text-sm shadow-sm">
            Žádné sauny nebyly v bezprostřední blízkosti nalezeny. Vyberte jiné krajské město v horní liště.
          </div>
        )}
      </div>
    </section>
  );
};
