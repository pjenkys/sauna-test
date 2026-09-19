import React from 'react';
import { useFilters } from '../context/FilterContext';
import { CZECH_REGIONS } from '../types';

export interface FilterSidebarProps {
  open?: boolean;
  onClose?: () => void;
  totalResults?: number;
}

const MS_BENEFIT_MAP: { id: string; label: string; sub?: string; benefitType: string }[] = [
  { id: 'all', label: 'Všechny sauny', benefitType: '' },
  { id: 'free100', label: '100% vstup zdarma', sub: 'neomezený čas', benefitType: 'free' },
  { id: 'freetime', label: 'Časově omezený vstup', sub: 'zdarma', benefitType: 'free_timed' },
  { id: 'discount', label: 'Sleva z běžného vstupného', benefitType: 'discount' },
  { id: 'surcharge', label: 'Vstup s doplatkem ke kartě', benefitType: 'surcharge' },
  { id: 'none', label: 'MultiSport není akceptována', benefitType: 'none' },
];

const TIME_OPTIONS = [
  { label: '60 min+', value: 60 },
  { label: '90 min+', value: 90 },
  { label: '120 min+', value: 120 },
];

const COOLING_MAP = [
  { label: 'Jakékoli ochlazení', value: '' },
  { label: 'Studená sprcha', value: 'shower' },
  { label: 'Ochlazovací bazén', value: 'plunge_pool' },
  { label: 'Jezírko / přirozená voda', value: 'natural_water' },
];

const SAUNA_MAP = [
  { label: 'Všechny typy prohřívárny', value: '' },
  { label: 'Finská sauna', value: 'finnish' },
  { label: 'Parní lázeň', value: 'steam' },
  { label: 'Infrared', value: 'infrared' },
  { label: 'Soudková sauna', value: 'outdoor' },
  { label: 'Bio sauna', value: 'bio' },
];

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  open = false,
  onClose = () => {},
  totalResults = 321,
}) => {
  const {
    filters,
    activeFiltersCount,
    setBenefitType,
    setTimeLimit,
    setCooling,
    setSaunaType,
    setRegionId,
    setHasCeremonialHall,
    resetFilters,
  } = useFilters();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-72 overflow-y-auto
          bg-card border-r border-border
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shrink-0
        `}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary">
                <path d="M3 6h18M7 12h10M11 18h2" />
              </svg>
              <span className="font-semibold text-base text-foreground">Filtry</span>
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-primary hover:underline transition-colors cursor-pointer"
                >
                  Resetovat
                </button>
              )}
              <button
                type="button"
                className="lg:hidden p-1 rounded hover:bg-muted cursor-pointer"
                onClick={onClose}
                aria-label="Zavřít filtry"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Results Count Box */}
          <div className="flex items-center justify-between mb-5 px-3 py-2.5 bg-primary/8 rounded-xl border border-primary/20">
            <span className="text-xs text-primary/80 font-medium">Odpovídá výsledků</span>
            <span className="text-sm font-bold text-primary">{totalResults}</span>
          </div>

          {/* 1. MultiSport Podmínky */}
          <section className="mb-5">
            <SectionHeader
              label="MultiSport podmínky"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
              }
            />
            <div className="flex flex-col gap-1">
              {MS_BENEFIT_MAP.map((item) => {
                const isSelected =
                  (!filters.benefit_type && item.benefitType === '') ||
                  filters.benefit_type === item.benefitType;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBenefitType(isSelected && item.benefitType !== '' ? '' : item.benefitType)}
                    className={`
                      w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all duration-150 flex items-start gap-3 cursor-pointer
                      ${isSelected ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'text-foreground hover:bg-muted/80'}
                    `}
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-primary bg-primary' : 'border-border'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                    </span>
                    <span className="flex-1 leading-snug">
                      <span className={isSelected ? 'font-medium' : ''}>{item.label}</span>
                      {item.sub && (
                        <span className="block text-[11px] text-muted-foreground mt-0.5">{item.sub}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-border mb-5" />

          {/* 2. Minimální čas MultiSportu */}
          <section className="mb-5">
            <SectionHeader
              label="Minimální čas MultiSportu"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
            />
            <div className="flex gap-2">
              {TIME_OPTIONS.map((item) => {
                const isSelected = filters.time_limit === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTimeLimit(isSelected ? null : item.value)}
                    className={`
                      flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer
                      ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/50 border-transparent text-foreground hover:border-border'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-border mb-5" />

          {/* 3. Ochlazení */}
          <section className="mb-5">
            <SectionHeader
              label="Ochlazení"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4M4 12h16" />
                </svg>
              }
            />
            <div className="grid grid-cols-2 gap-1.5">
              {COOLING_MAP.map((item) => {
                const isSelected =
                  (!filters.cooling && item.value === '') || filters.cooling === item.value;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCooling(isSelected && item.value !== '' ? '' : item.value)}
                    className={`
                      text-left text-xs px-3 py-2.5 rounded-xl border transition-all duration-150 leading-snug cursor-pointer
                      ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                          : 'border-border text-foreground hover:bg-muted/60'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-border mb-5" />

          {/* 4. Typ a vybavení sauny */}
          <section className="mb-5">
            <SectionHeader
              label="Typ a vybavení sauny"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              }
            />
            <div className="flex flex-col gap-1">
              {SAUNA_MAP.map((item) => {
                const isSelected =
                  (!filters.sauna_type && item.value === '') || filters.sauna_type === item.value;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSaunaType(isSelected && item.value !== '' ? '' : item.value)}
                    className={`
                      w-full text-left text-sm px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer
                      ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted/80'}
                    `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Ceremonial hall checkbox */}
            <label className="flex items-center gap-2 pt-3 text-xs text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={filters.has_ceremonial_hall}
                onChange={(e) => setHasCeremonialHall(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 accent-primary cursor-pointer"
              />
              <span>Pouze s ceremoniálním sálem</span>
            </label>
          </section>

          <div className="border-t border-border mb-5" />

          {/* 5. Kraj ČR */}
          <section className="mb-2">
            <SectionHeader
              label="Kraj ČR"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
            />
            <select
              value={filters.region_id}
              onChange={(e) => setRegionId(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:bg-card cursor-pointer transition-colors"
            >
              <option value="">Celá Česká republika</option>
              {CZECH_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </section>
        </div>
      </aside>
    </>
  );
};
