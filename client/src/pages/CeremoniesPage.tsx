import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles, User, MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { SaunaCeremony, CEREMONY_CATEGORIES, CEREMONY_CATEGORY_LABELS, CeremonyCategoryCode } from '../types';

interface CeremoniesPageProps {
  navigate: (path: string) => void;
}

const DAYS_CZ = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];

export const CeremoniesPage: React.FC<CeremoniesPageProps> = ({ navigate }) => {
  const [ceremonies, setCeremonies] = useState<SaunaCeremony[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .getCeremonies({
        category: selectedCategory || undefined,
        day_of_week: selectedDay !== null ? selectedDay : undefined,
      })
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setCeremonies(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load ceremonies', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDay, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-background">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Zážitkové saunování & Show s ručníkem</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-normal text-[#1C1917] tracking-tight">
          Kalendář saunových ceremoniálů
        </h1>
        <p className="text-sm text-[#78716C] mt-2 leading-relaxed">
          Pravidelné i speciální rituály, divadla saunových mistrů, bylinná aromaterapie a noční
          saunování v nejlepších wellness centrech ČR.
        </p>
      </div>

      {/* Filters: Day & Category */}
      <div className="p-6 sm:p-7 rounded-xl bg-white border border-border space-y-5 shadow-sm">
        {/* Day selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2.5">
            Vyberte den v týdnu:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                selectedDay === null
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'bg-[#F5F1E9] text-[#1C1917] hover:bg-[#EAE2D5] border border-border'
              }`}
            >
              Všechny dny
            </button>
            {DAYS_CZ.map((day, idx) => (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  selectedDay === idx
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'bg-[#F5F1E9] text-[#1C1917] hover:bg-[#EAE2D5] border border-border'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Category selection */}
        <div className="pt-3 border-t border-border">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2.5">
            Kategorie ceremoniálu:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                !selectedCategory
                  ? 'bg-[#2D4A3E] text-white font-semibold shadow-sm'
                  : 'bg-[#F5F1E9] text-[#1C1917] hover:bg-[#EAE2D5] border border-border'
              }`}
            >
              Všechny typy
            </button>
            {(Object.values(CEREMONY_CATEGORIES) as CeremonyCategoryCode[]).map((code) => {
              const info = CEREMONY_CATEGORY_LABELS[code];
              const isSelected = selectedCategory === code;
              return (
                <button
                  key={code}
                  onClick={() => setSelectedCategory(isSelected ? '' : code)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#2D4A3E] text-white font-semibold shadow-sm'
                      : 'bg-[#F5F1E9] text-[#1C1917] hover:bg-[#EAE2D5] border border-border'
                  }`}
                >
                  {info.cz}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ceremonies List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 rounded-xl bg-[#F5F1E9] border border-border" />
          ))}
        </div>
      ) : ceremonies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ceremonies.map((c) => {
            const catLabel = CEREMONY_CATEGORY_LABELS[c.category as CeremonyCategoryCode]?.cz || c.category;

            return (
              <div
                key={c.id}
                className="p-6 sm:p-7 rounded-xl bg-white border border-border hover:border-[#C26747]/40 transition-all duration-300 shadow-sm hover:shadow-sm-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {c.start_time} – {c.end_time}
                    </span>

                    <span className="text-xs text-[#78716C] font-medium">
                      {c.day_of_week !== null && c.day_of_week !== undefined
                        ? DAYS_CZ[c.day_of_week]
                        : 'Pravidelně'}
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-[#1C1917] text-lg mb-1">{c.title}</h3>
                  <div className="text-xs text-primary font-semibold mb-3">{catLabel}</div>
                  <p className="text-sm text-[#78716C] leading-relaxed line-clamp-3 mb-4">
                    {c.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    {c.venue_name && (
                      <div className="flex items-center gap-1.5 text-[#1C1917] font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{c.venue_name}</span>
                      </div>
                    )}
                    {c.ceremony_master && (
                      <div className="flex items-center gap-1.5 text-[#78716C] text-[11px]">
                        <User className="w-3 h-3 text-[#A8A29E]" />
                        <span>Saunér: {c.ceremony_master}</span>
                      </div>
                    )}
                  </div>

                  {c.venue_slug && (
                    <button
                      onClick={() => navigate(`/sauna/${c.venue_slug}`)}
                      className="px-4 py-2 rounded-full bg-[#F5F1E9] hover:bg-[#EAE2D5] text-[#1C1917] border border-border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                      <span>Detail areálu</span>
                      <ExternalLink className="w-3 h-3 text-[#78716C]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-white border border-border text-center max-w-md mx-auto space-y-3 shadow-sm">
          <Calendar className="w-8 h-8 text-[#A8A29E] mx-auto" />
          <h3 className="text-lg font-display font-semibold text-[#1C1917]">Pro zvolený filtr není vypsán žádný ceremoniál</h3>
          <p className="text-xs text-[#78716C]">
            Zkuste vybrat jiný den nebo zobrazit všechny kategorie ceremoniálů.
          </p>
        </div>
      )}
    </div>
  );
};
