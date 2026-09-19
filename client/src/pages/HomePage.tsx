import React, { useState, useEffect } from 'react';
import { Hero } from '../components/Hero';
import { CategoryCards } from '../components/CategoryCards';
import { SaunaCard } from '../components/SaunaCard';
import { AffiliateGrid } from '../components/AffiliateGrid';
import { api } from '../services/api';
import { SaunaSummary } from '../types';
import { Sparkles, ArrowRight, CreditCard, Droplets, CheckCircle2 } from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [promotedSaunas, setPromotedSaunas] = useState<SaunaSummary[]>([]);
  const [isLoadingPromoted, setIsLoadingPromoted] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getSaunas({ sort: 'recommended', limit: 4 })
      .then((res) => {
        if (isMounted && res.success && res.data) {
          // Filter promoted or top rated
          const featured = res.data.slice(0, 4);
          setPromotedSaunas(featured);
        }
      })
      .catch((err) => {
        console.error('Failed to load featured saunas', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPromoted(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 bg-background">
      {/* 1. Hero with Geolocation Nearest Recommendations */}
      <Hero navigate={navigate} />

      {/* 2. Four Category Rozcestníky */}
      <CategoryCards navigate={navigate} />

      {/* 3. Promoted Partners & Top Rated Saunas */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Doporučení partneři & špičková wellness</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display text-foreground tracking-tight">
              Vybrané saunové světy v České republice
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl font-normal">
              Propagované sauny jsou označeny štítkem partnera, avšak jejich uživatelské hodnocení
              zůstává 100% autentické a nezkreslené.
            </p>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-sm font-medium text-primary-foreground transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <span>Všechny sauny na mapě</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isLoadingPromoted ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 rounded-xl bg-card border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {promotedSaunas.map((sauna) => (
              <SaunaCard
                key={sauna.id}
                sauna={sauna}
                onClick={() => navigate(`/sauna/${sauna.slug}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. MultiSport Transparency Educational Callout */}
      <section className="py-12 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-10 rounded-xl bg-card border border-border shadow-sm relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-3">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                <span>MultiSport bez překvapení na recepci</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display text-foreground leading-tight mb-3">
                Víte přesně, kolik minut máte zdarma a jaký je případný doplatek.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                V naší databázi naleznete přesně rozklíčovaná pravidla pro 320+ saunových center po celé republice:
                zda je vstup 100% volný, na kolik minut (60, 90 či 120 min) platí, nebo zda se hradí fixní doplatek na recepci.
              </p>
              <button
                onClick={() => navigate('/explore?benefit_type=free_time_limited')}
                className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Filtrovat sauny s MultiSport kartou</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Affiliate Partner Recommendations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AffiliateGrid />
      </div>
    </div>
  );
};
