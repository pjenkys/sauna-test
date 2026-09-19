import React, { useState } from 'react';
import { PlusCircle, CheckCircle2, AlertCircle, Sparkles, Building, MapPin, Mail, User } from 'lucide-react';
import { api, SuggestionInput } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VENUE_CATEGORIES, VENUE_CATEGORY_LABELS, VenueCategoryCode } from '../types';

interface SubmitSaunaPageProps {
  navigate: (path: string) => void;
}

export const SubmitSaunaPage: React.FC<SubmitSaunaPageProps> = ({ navigate }) => {
  const { user } = useAuth();

  const [venueName, setVenueName] = useState('');
  const [category, setCategory] = useState<VenueCategoryCode>('public');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [multisportStatus, setMultisportStatus] = useState('');
  const [coolingOptions, setCoolingOptions] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [submitterName, setSubmitterName] = useState(user?.display_name || '');
  const [submitterEmail, setSubmitterEmail] = useState(user?.email || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const coolingCheckboxes = [
    { id: 'indoor_plunge_pool', label: 'Vnitřní ochlazovací bazének' },
    { id: 'outdoor_plunge_pool', label: 'Venkovní bazének' },
    { id: 'natural_water', label: 'Přírodní voda (jezero, řeka, rybník)' },
    { id: 'ice_well', label: 'Ledová studna / tříšť' },
    { id: 'bucket_shower', label: 'Polévací vědro' },
    { id: 'experience_showers', label: 'Zážitkové sprchy' },
  ];

  const handleToggleCooling = (id: string) => {
    setCoolingOptions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!venueName.trim() || !streetAddress.trim() || !submitterEmail.trim()) {
      setError('Vyplňte prosím název, adresu a svůj e-mail.');
      return;
    }

    if (!submitterEmail.includes('@')) {
      setError('Zadejte platný kontaktní e-mail.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SuggestionInput = {
        venue_name: venueName.trim(),
        category,
        street_address: streetAddress.trim(),
        city: city.trim() || 'Praha',
        multisport_status: multisportStatus.trim() || undefined,
        cooling_options: coolingOptions.length > 0 ? coolingOptions : undefined,
        description: description.trim() || undefined,
        submitter_name: submitterName.trim() || undefined,
        submitter_email: submitterEmail.trim(),
      };

      await api.submitSuggestion(payload);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Nastala chyba při odesílání návrhu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-background">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Komunitní rozšiřování databáze</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-normal text-[#1C1917] tracking-tight">
          Navrhnout novou saunu
        </h1>
        <p className="text-sm text-[#78716C] mt-2 leading-relaxed">
          Chybí vám v naší databázi vaše oblíbená sauna nebo wellness? Pošlete nám tip. Po rychlém
          schválení moderátorem bude zařazena do veřejného katalogu.
        </p>
      </div>

      {isSuccess ? (
        <div className="p-8 sm:p-12 rounded-xl bg-white border border-border text-center shadow-sm space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-normal text-[#1C1917]">Návrh byl úspěšně zaznamenán!</h2>
          <p className="text-sm text-[#78716C] max-w-md mx-auto leading-relaxed">
            Děkujeme za váš příspěvek české saunové komunitě. Váš návrh byl uložen se stavem
            <strong className="text-primary font-semibold"> čeká na schválení (pending)</strong>. Náš tým údaje
            ověří a zařadí saunu do vyhledávače.
          </p>
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setIsSuccess(false);
                setVenueName('');
                setCity('');
                setStreetAddress('');
                setDescription('');
              }}
              className="px-6 py-2.5 rounded-full bg-[#F5F1E9] hover:bg-[#EAE2D5] text-[#1C1917] border border-border font-medium text-xs cursor-pointer shadow-sm"
            >
              Navrhnout další saunu
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-xs cursor-pointer shadow-sm"
            >
              Přejít do katalogu
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-10 rounded-xl bg-white border border-border shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-start gap-2.5 text-xs font-medium">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Základní informace */}
            <div className="space-y-4">
              <h3 className="text-base font-display font-semibold text-[#1C1917] flex items-center gap-2 pb-3 border-b border-border">
                <Building className="w-4 h-4 text-primary" />
                Informace o sauně / wellness
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                  Název sauny nebo areálu *
                </label>
                <input
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="např. Saunia Westfield Chodov nebo Městské lázně Plzeň"
                  className="w-full bg-[#F5F1E9] border border-border rounded-xl px-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C26747] focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Kategorie sauny
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VenueCategoryCode)}
                    className="w-full bg-[#F5F1E9] border border-border rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#C26747] focus:bg-white transition-colors cursor-pointer"
                  >
                    {Object.entries(VENUE_CATEGORIES).map(([_, code]) => (
                      <option key={code} value={code}>
                        {VENUE_CATEGORY_LABELS[code].cz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Město / Obec *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="např. Liberec, Brno, Praha"
                    className="w-full bg-[#F5F1E9] border border-border rounded-xl px-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C26747] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                  Ulice a číslo / Přesná adresa *
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="např. Roztylská 2321/19"
                  className="w-full bg-[#F5F1E9] border border-border rounded-xl px-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C26747] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Vybavení a MultiSport */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-base font-display font-semibold text-[#1C1917] flex items-center gap-2 pb-3 border-b border-border">
                <MapPin className="w-4 h-4 text-[#2D4A3E]" />
                Vybavení a MultiSport
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                  MultiSport karta (pokud víte podrobnosti)
                </label>
                <input
                  type="text"
                  value={multisportStatus}
                  onChange={(e) => setMultisportStatus(e.target.value)}
                  placeholder="např. Platí celodenně na 90 min zdarma, doplatek 25 Kč za každých 15 min"
                  className="w-full bg-[#F5F1E9] border border-border rounded-xl px-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C26747] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-2">
                  Způsoby ochlazení v areálu:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {coolingCheckboxes.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 text-xs text-[#1C1917] bg-[#F5F1E9] p-3 rounded-xl border border-border cursor-pointer hover:bg-[#EAE2D5] transition-all shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={coolingOptions.includes(item.id)}
                        onChange={() => handleToggleCooling(item.id)}
                        className="rounded border-border text-primary focus:ring-[#C26747] w-4 h-4 accent-[#C26747]"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                  Doplňující popis nebo poznámky
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bylinková sauna, ochlazovací jezírko, skvělý saunér Petr, otevírací doba..."
                  className="w-full bg-[#F5F1E9] border border-border rounded-xl p-3 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C26747] focus:bg-white transition-colors resize-none"
                />
              </div>
            </div>

            {/* Kontaktní údaje odesílatele */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-base font-display font-semibold text-[#1C1917] flex items-center gap-2 pb-3 border-b border-border">
                <User className="w-4 h-4 text-primary" />
                Vaše kontaktní údaje (pro moderátora)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Vaše jméno nebo přezdívka
                  </label>
                  <input
                    type="text"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    placeholder="Jan Novák"
                    className="w-full bg-[#F5F1E9] border border-border rounded-xl px-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C26747] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Váš e-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    placeholder="vas@email.cz"
                    className="w-full bg-[#F5F1E9] border border-border rounded-xl px-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C26747] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-sm hover:shadow-sm-hover transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Odesílám návrh...' : 'Odeslat návrh sauny ke schválení'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
