import React from 'react';
import { SearchX, RotateCcw, Sparkles, Filter } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

interface ZeroStateProps {
  suggestedRelaxations?: string[];
}

export const ZeroState: React.FC<ZeroStateProps> = ({ suggestedRelaxations = [] }) => {
  const { filters, resetFilters, relaxSuggestedFilters } = useFilters();

  const relaxationLabels: Record<string, string> = {
    time_limit: 'Zrušit minimální časový limit MultiSportu',
    benefit_type: 'Rozšířit hledání i na sauny bez karty MultiSport',
    cooling: 'Zrušit specifické omezení na ochlazovací bazének / vodu',
    sauna_type: 'Hledat i ostatní typy saun a prohříváren',
    region_id: 'Hledat v celé České republice (nejen v tomto kraji)',
    category: 'Povolit všechny kategorie saun',
    nudity_policy: 'Nerozlišovat pravidla nošení plavek',
    has_ceremonial_hall: 'Zobrazit i sauny bez ceremoniálního sálu',
  };

  return (
    <div className="p-8 sm:p-12 rounded-[28px] bg-surface-container-low border border-outline-variant/60 text-center max-w-2xl mx-auto my-8 shadow-elevation-1">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container text-primary border border-outline-variant/60 mb-5 shadow-elevation-1">
        <SearchX className="w-8 h-8 text-primary" />
      </div>

      <h3 className="text-2xl font-bold text-on-surface mb-2">
        Nenalezena žádná sauna odpovídající všem parametrům
      </h3>

      <p className="text-sm text-on-surface-variant leading-relaxed mb-6 max-w-md mx-auto">
        Kombinace zadaných filtrů je příliš úzká. Zkuste uvolnit některé podmínky nebo klikněte na
        jedno z našich inteligentních doporučení níže.
      </p>

      {/* Suggested Filter Relaxations */}
      {suggestedRelaxations.length > 0 ? (
        <div className="mb-6 text-left p-5 rounded-2xl bg-surface-container border border-outline-variant/60 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Doporučená uvolnění filtrů:</span>
          </div>
          <div className="space-y-2">
            {suggestedRelaxations.map((key) => (
              <button
                key={key}
                onClick={() => relaxSuggestedFilters([key])}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-xs text-on-surface flex items-center justify-between transition-colors border border-outline-variant/50 cursor-pointer shadow-elevation-1"
              >
                <span>{relaxationLabels[key] || `Zrušit filtr: ${key}`}</span>
                <span className="text-[10px] font-bold text-primary bg-primary-container px-2.5 py-0.5 rounded-full border border-primary/20">
                  Uvolnit
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {filters.time_limit && (
            <button
              onClick={() => relaxSuggestedFilters(['time_limit'])}
              className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors border border-outline-variant/60 font-medium"
            >
              Zrušit limit {filters.time_limit} min
            </button>
          )}
          {filters.cooling && (
            <button
              onClick={() => relaxSuggestedFilters(['cooling'])}
              className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors border border-outline-variant/60 font-medium"
            >
              Zrušit filtr bazénku
            </button>
          )}
          {filters.region_id && (
            <button
              onClick={() => relaxSuggestedFilters(['region_id'])}
              className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors border border-outline-variant/60 font-medium"
            >
              Hledat v celé ČR
            </button>
          )}
        </div>
      )}

      {/* Complete Reset Button */}
      <button
        onClick={resetFilters}
        className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-medium text-xs transition-colors shadow-elevation-1 cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Resetovat všechny filtry na výchozí stav</span>
      </button>
    </div>
  );
};
