import React from 'react';
import { Waves, Sparkles, Key, Mountain, ArrowRight } from 'lucide-react';
import { VENUE_CATEGORIES, VENUE_CATEGORY_LABELS, VenueCategoryCode } from '../types';
import { useFilters } from '../context/FilterContext';

interface CategoryCardsProps {
  navigate: (path: string) => void;
}

const CATEGORY_DETAILS: Record<
  VenueCategoryCode,
  {
    icon: React.ComponentType<{ className?: string }>;
    tagline: string;
    image: string;
    accentColor: string;
  }
> = {
  [VENUE_CATEGORIES.PUBLIC]: {
    icon: Waves,
    tagline: 'Dostupné saunování v městských a plaveckých areálech',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    accentColor: 'from-sky-500/20 to-transparent border-sky-500/30',
  },
  [VENUE_CATEGORIES.WELLNESS_CEREMONIAL]: {
    icon: Sparkles,
    tagline: 'Saunová divadla, rituály s ručníkem a zážitkové ceremoniály',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
    accentColor: 'from-amber-500/20 to-transparent border-amber-500/30',
  },
  [VENUE_CATEGORIES.PRIVATE]: {
    icon: Key,
    tagline: 'Diskrétní zóny a privátní vířivky pro páry i uzavřené party',
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80',
    accentColor: 'from-purple-500/20 to-transparent border-purple-500/30',
  },
  [VENUE_CATEGORIES.HOTEL_MOUNTAIN]: {
    icon: Mountain,
    tagline: 'Horská relaxace s panoramatickými výhledy a venkovními biotopy',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=600&q=80',
    accentColor: 'from-emerald-500/20 to-transparent border-emerald-500/30',
  },
};

export const CategoryCards: React.FC<CategoryCardsProps> = ({ navigate }) => {
  const { setCategory } = useFilters();

  const handleCategoryClick = (categoryCode: VenueCategoryCode) => {
    setCategory(categoryCode);
    navigate(`/explore?category=${categoryCode}`);
  };

  const categories = Object.values(VENUE_CATEGORIES) as VenueCategoryCode[];

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-background">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-xs uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full inline-block mb-2 font-semibold">
          Kategorie wellness
        </span>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-foreground tracking-tight">
          Vyberte si styl saunového zážitku
        </h2>
        <p className="text-sm text-muted-foreground mt-2 font-normal">
          Čtyři světy pro regeneraci těla, uvolnění mysli a ceremoniální rituály
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((catCode) => {
          const cat = VENUE_CATEGORY_LABELS[catCode];
          const details = CATEGORY_DETAILS[catCode];
          const Icon = details.icon;

          return (
            <div
              key={catCode}
              onClick={() => handleCategoryClick(catCode)}
              className="group relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 flex flex-col cursor-pointer"
            >
              {/* Image banner */}
              <div className="relative h-44 w-full overflow-hidden p-2">
                <div className="w-full h-full rounded-lg overflow-hidden relative bg-muted/40">
                  <img
                    src={details.image}
                    alt={cat.cz}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 w-8 h-8 rounded-lg bg-card/90 backdrop-blur-md flex items-center justify-center text-primary shadow-sm border border-border">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Text content */}
              <div className="px-4 pb-4 pt-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                    {cat.cz}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {details.tagline}
                  </p>
                </div>

                <div className="flex items-center text-xs font-medium text-primary group-hover:underline transition-colors pt-2.5 border-t border-border">
                  <span>Prozkoumat kategorii</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
