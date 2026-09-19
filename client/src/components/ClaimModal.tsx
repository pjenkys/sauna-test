import React, { useState } from 'react';
import { X, Building2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { api, ClaimInput } from '../services/api';
import { validateIco } from '../utils/icoValidator';

interface ClaimModalProps {
  isOpen: boolean;
  venueId: string;
  venueName: string;
  onClose: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  venueId,
  venueName,
  onClose,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [ico, setIco] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantRole, setApplicantRole] = useState('Provozní manažer');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const isIcoValid = ico.trim() ? validateIco(ico.trim()) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateIco(ico.trim())) {
      setError('Zadané IČO není platné dle kontrolního algoritmu Modulo-11.');
      return;
    }

    if (!businessEmail || !businessEmail.includes('@')) {
      setError('Zadejte platnou firemní e-mailovou adresu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ClaimInput = {
        venue_id: venueId,
        business_name: businessName.trim(),
        ico: ico.trim(),
        applicant_name: applicantName.trim(),
        applicant_role: applicantRole.trim(),
        business_email: businessEmail.trim(),
        phone: phone.trim(),
        billing_address: billingAddress.trim() || undefined,
      };

      await api.submitClaim(payload);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Nastala chyba při odesílání žádosti o nárokování');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface-container-high border border-outline-variant/60 rounded-[28px] shadow-elevation-3 p-6 sm:p-8 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container text-on-primary-container mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold text-on-surface mb-2">Žádost byla úspěšně odeslána</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-md mx-auto mb-6">
              Náš tým ověří shodu zadaného IČO a domény e-mailu. Po schválení získáte přístup ke správě
              profilu <strong className="text-on-surface font-semibold">{venueName}</strong>.
            </p>
            <button
              onClick={onClose}
              className="px-7 py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-medium text-xs transition-colors shadow-elevation-1"
            >
              Rozumím a zavřít
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>B2B ověření provozovatele</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-on-surface">Nárokovat profil: {venueName}</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Získejte kontrolu nad otevírací dobou, ceníkem a programem ceremoniálů.
              </p>
            </div>

            {/* Ethical Guarantee Notice */}
            <div className="mb-5 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-2.5 text-xs text-on-surface">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>
                <strong className="font-semibold text-on-surface">Transparentní pravidla:</strong> Získání odznaku Ověřeného partnera žádným
                způsobem neovlivňuje autentické hodnocení návštěvníků. Recenze zůstávají 100% nezávislé.
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                  Obchodní firma / Název společnosti dle OR *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="např. Saunový ráj s.r.o."
                  className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                    IČO společnosti (8 číslic) *
                  </label>
                  {isIcoValid !== null && (
                    <span
                      className={`text-[10px] font-semibold ${
                        isIcoValid ? 'text-primary' : 'text-red-700'
                      }`}
                    >
                      {isIcoValid ? '✓ Platné IČO (Modulo-11)' : '✗ Neplatné IČO'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={ico}
                  onChange={(e) => setIco(e.target.value.replace(/\D/g, ''))}
                  placeholder="např. 27082440"
                  className={`w-full bg-surface-container-lowest border rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none ${
                    isIcoValid === false
                      ? 'border-red-400 focus:border-red-500'
                      : isIcoValid === true
                      ? 'border-primary focus:border-primary'
                      : 'border-outline focus:border-primary'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                    Jméno zástupce *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="např. Jan Novák"
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                    Pozice v provozovně
                  </label>
                  <input
                    type="text"
                    value={applicantRole}
                    onChange={(e) => setApplicantRole(e.target.value)}
                    placeholder="Jednatel / Manažer"
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                    Firemní e-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="provoz@sauna.cz"
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                    Kontaktní telefon
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+420 777 123 456"
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1">
                  Sídlo společnosti / Fakturační adresa
                </label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="např. Václavské náměstí 1, Praha 1"
                  className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isIcoValid === false}
                className="w-full mt-2 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-medium text-xs shadow-elevation-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Ověřuji a odesílám...' : 'Odeslat žádost o nárokování'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
