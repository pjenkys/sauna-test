import React, { useState } from 'react';
import { X, Star, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, ReviewInput } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ReviewModalProps {
  isOpen: boolean;
  venueId: string;
  venueName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  venueId,
  venueName,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [overall, setOverall] = useState<number>(5);
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [heatQuality, setHeatQuality] = useState<number>(5);
  const [coolingQuality, setCoolingQuality] = useState<number>(5);
  const [staffCeremony, setStaffCeremony] = useState<number>(5);
  const [priceValue, setPriceValue] = useState<number>(5);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tips, setTips] = useState('');
  const [recommendedTime, setRecommendedTime] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Pro přidání recenze se musíte nejprve přihlásit.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: ReviewInput = {
        venue_id: venueId,
        overall_rating: overall,
        cleanliness,
        heat_quality: heatQuality,
        cooling_quality: coolingQuality,
        staff_ceremony: staffCeremony,
        price_value: priceValue,
        title: title.trim() || 'Moje návštěva sauny',
        content: content.trim(),
        tips: tips.trim() || undefined,
        recommended_time: recommendedTime.trim() || undefined,
        visit_date: visitDate || undefined,
      };

      await api.createReview(payload);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Chyba při odesílání recenze');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarPicker = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-on-surface-variant font-medium">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="p-1 text-outline hover:text-amber-400 focus:outline-none transition-colors cursor-pointer"
          >
            <Star
              className={`w-4 h-4 ${
                s <= value ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-on-surface w-5 text-right">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface-container-high border border-outline-variant/60 rounded-[28px] shadow-elevation-3 p-6 sm:p-8 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold text-on-surface mb-2">Děkujeme za recenzi!</h3>
            <p className="text-sm text-on-surface-variant">
              Vaše hodnocení bylo úspěšně uloženo a přepočítalo celkové skóre.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>ČSFD-styl hodnocení</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-on-surface">Napsat recenzi pro {venueName}</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Ohodnoťte celkový zážitek a jednotlivé parametry pro ostatní návštěvníky
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Celkové hodnocení (1-5 hvězd) */}
              <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-center">
                <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-2">
                  Celkový dojem (1–5 hvězdiček)
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOverall(s)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          s <= overall ? 'fill-amber-400 text-amber-400' : 'text-outline-variant'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs text-amber-900 font-semibold mt-2">
                  {overall === 5
                    ? '5/5 — Naprosto excelentní'
                    : overall === 4
                    ? '4/5 — Velmi dobré'
                    : overall === 3
                    ? '3/5 — Průměrné'
                    : overall === 2
                    ? '2/5 — Zklamání'
                    : '1/5 — Špatné'}
                </div>
              </div>

              {/* 5 dílčích kritérií */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-1">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                  Dílčí hodnocení parametrů
                </h4>
                <StarPicker value={cleanliness} onChange={setCleanliness} label="Čistota prostředí a šaten" />
                <StarPicker value={heatQuality} onChange={setHeatQuality} label="Kvalita tepla a páry" />
                <StarPicker value={coolingQuality} onChange={setCoolingQuality} label="Možnosti ochlazení (bazének, voda)" />
                <StarPicker value={staffCeremony} onChange={setStaffCeremony} label="Personál & ceremoniály" />
                <StarPicker value={priceValue} onChange={setPriceValue} label="Poměr cena / výkon" />
              </div>

              {/* Titulek */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                  Titulek recenze
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="např. Výborný saunový svět s parádním venkovním jezírkem"
                  className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
              </div>

              {/* Slovní komentář */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                  Slovní komentář (max 3000 znaků)
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Popište své zkušenosti, teplotu saun, chování obsluhy nebo atmosféru..."
                  className="w-full bg-surface-container-lowest border border-outline rounded-xl p-3 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Tipy pro návštěvníky */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                    Tip pro ostatní
                  </label>
                  <input
                    type="text"
                    value={tips}
                    onChange={(e) => setTips(e.target.value)}
                    placeholder="např. Zaparkovat lze přímo v suterénu"
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                    Datum návštěvy
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-medium text-xs shadow-elevation-1 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Ukládám recenzi...' : 'Publikovat recenzi'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
