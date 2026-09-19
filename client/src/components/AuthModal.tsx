import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(initialMode === 'login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        if (!displayName.trim()) {
          throw new Error('Zadejte své jméno nebo přezdívku');
        }
        await register({ email, password, display_name: displayName.trim() });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nastala chyba při autentizaci');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-container-high border border-outline-variant/60 rounded-[28px] shadow-elevation-3 p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
          aria-label="Zavřít"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container mb-3 shadow-sm">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-on-surface">
            {isLogin ? 'Přihlášení do Sauny ČR' : 'Vytvořit účet'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            {isLogin
              ? 'Hodnoťte sauny, ukládejte oblíbená místa a pište tipy'
              : 'Připojte se k české komunitě milovníků saunování'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1.5">
                Vaše jméno nebo přezdívka
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-outline" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="např. Jan Novák"
                  className="w-full bg-surface-container-lowest border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1.5">
              E-mailová adresa
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-outline" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
                className="w-full bg-surface-container-lowest border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant mb-1.5">
              Heslo
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-outline" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-lowest border border-outline rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-medium text-xs transition-colors shadow-elevation-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting
              ? 'Zpracovávám...'
              : isLogin
              ? 'Přihlásit se'
              : 'Zaregistrovat se'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-outline-variant/40 text-center">
          <p className="text-xs text-on-surface-variant">
            {isLogin ? 'Ještě nemáte účet? ' : 'Již máte svůj účet? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              {isLogin ? 'Zaregistrujte se zdarma' : 'Přihlaste se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
