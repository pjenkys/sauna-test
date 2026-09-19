import React from 'react';
import { Flame, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { regions, setManualLocation } = useLocation();

  const handleRegionClick = (regionId: string) => {
    setManualLocation(regionId);
    navigate('/explore');
  };

  return (
    <footer className="bg-[#1C1917] text-[#A8A29E] border-t border-[#2A241E] mt-auto">
      {/* Ethical Non-Subscription Declaration Banner */}
      <div className="border-b border-[#2A241E] bg-[#2A241E]/40 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-[#C26747]/30 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display text-base font-semibold text-white tracking-wide">
                100% Bezplatný průvodce pro návštěvníky (Ethical No-Subscription)
              </h4>
              <p className="text-xs text-[#A8A29E] mt-0.5">
                Všechna místa, otevírací doby, transparentní MultiSport pravidla i autentické recenze jsou a navždy zůstanou zdarma bez předplatného.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#EAE2D5] bg-[#2A241E] px-4 py-2 rounded-full border border-[#3A3228] shrink-0 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Nezávislá komunitní platforma ČR</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-display text-lg font-bold text-white tracking-tight">
                  Kouzelné Sauny ČR
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-primary font-semibold">
                  Amazing Wellness
                </span>
              </div>
            </div>
            <p className="text-xs text-[#A8A29E] leading-relaxed mb-4">
              Kurátorský průvodce saunovými světy, ceremoniálními wellness a privátními lázněmi po celé České republice.
            </p>
            <div className="text-[11px] text-[#A8A29E] flex items-center gap-1.5">
              <span>Vytvořeno s</span>
              <Heart className="w-3 h-3 text-primary fill-[#C26747]" />
              <span>pro českou saunovou komunitu</span>
            </div>
          </div>

          {/* Col 2: Rychlé odkazy */}
          <div>
            <h5 className="font-display text-sm font-semibold text-white mb-4">
              Kolekce a objevování
            </h5>
            <ul className="space-y-2.5 text-xs text-[#A8A29E]">
              <li>
                <button
                  onClick={() => navigate('/explore')}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Katalog a mapa všech saun
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/ceremonies')}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Kalendář ceremoniálů
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/pridat-saunu')}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Navrhnout novou saunu
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/profil')}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  Můj profil a uložená místa
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Kraje a regiony ČR (All 14 regions) */}
          <div>
            <h5 className="font-display text-sm font-semibold text-white mb-4">
              Všechny kraje ČR
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#A8A29E]">
              {regions.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRegionClick(r.id)}
                  className="text-left hover:text-primary transition-colors truncate cursor-pointer"
                >
                  {r.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Col 4: Provozovatelé B2B */}
          <div>
            <h5 className="font-display text-sm font-semibold text-white mb-4">
              Pro provozovatele
            </h5>
            <p className="text-xs text-[#A8A29E] leading-relaxed mb-4">
              Provozujete wellness centrum či saunový svět? Nárokujte si svůj profil zdarma s ověřením IČO.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2A241E] hover:bg-[#3A3228] border border-[#3A3228] text-xs font-medium text-white transition-all cursor-pointer shadow-sm"
            >
              <span>Nárokovat profil sauny</span>
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-[#2A241E] flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-4">
          <p>© {new Date().getFullYear()} Kouzelná Saunová Místa ČR. Všechna práva vyhrazena.</p>
          <div className="flex items-center gap-6">
            <span>Inspirováno kouzelnými wellness místy v ČR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
