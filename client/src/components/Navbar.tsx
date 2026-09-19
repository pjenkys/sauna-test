import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { location, regions, setManualLocation, requestGeolocation, isLocating } = useLocation();
  const { user, logout } = useAuth();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSelectRegion = (regionId: string) => {
    setManualLocation(regionId);
    setIsLocationOpen(false);
  };

  const handleGPS = () => {
    requestGeolocation();
    setIsLocationOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-6">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 shrink-0 text-left cursor-pointer focus:outline-none bg-transparent border-0 p-0"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M12 2C8.5 6 6 9.5 6 13a6 6 0 0012 0c0-3.5-2.5-7-6-11z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-foreground leading-tight">
                Kouzelná Saunová Místa
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                Kurátorský průvodce saunami a wellness
              </div>
            </div>
            <span className="text-xs text-muted-foreground border border-border rounded px-1 py-0.5 ml-1">
              ČR
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/' || currentPath === '/explore'
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
              Objevovat sauny
            </button>

            <button
              type="button"
              onClick={() => navigate('/ceremonies')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/ceremonies'
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Ceremoniály
            </button>

            <button
              type="button"
              onClick={() => navigate('/pridat-saunu')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/pridat-saunu'
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              Přidat saunu
            </button>
          </nav>

          <div className="flex-1" />

          {/* Right side: Region picker & User button & Mobile burger */}
          <div className="flex items-center gap-2">
            {/* Region picker button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-full text-sm text-foreground hover:border-primary/50 transition-colors bg-background cursor-pointer"
                title="Vybrat polohu pro výpočet vzdáleností"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-primary">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="max-w-[130px] truncate">{location.label}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-muted-foreground">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isLocationOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg p-2 z-50 text-xs">
                  <div className="p-2.5 border-b border-border flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Výchozí lokace ČR</span>
                    <button
                      type="button"
                      onClick={handleGPS}
                      disabled={isLocating}
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold cursor-pointer bg-background border border-border px-2.5 py-1 rounded-full"
                    >
                      {isLocating ? 'Hledám...' : 'Použít GPS'}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                    {regions.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectRegion(r.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors flex items-center justify-between cursor-pointer ${
                          location.regionId === r.id ? 'text-primary font-semibold bg-primary/10' : 'text-foreground'
                        }`}
                      >
                        <span>{r.shortName}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">{r.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                  title={user.display_name}
                >
                  {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg p-1.5 z-50 text-xs">
                    <div className="px-3.5 py-2.5 border-b border-border">
                      <div className="font-semibold text-foreground truncate">{user.display_name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profil');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 text-foreground flex items-center gap-2 cursor-pointer mt-1"
                    >
                      Můj profil a seznamy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2 cursor-pointer"
                    >
                      Odhlásit se
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                title="Přihlásit se"
              >
                V
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-2 shadow-md">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left cursor-pointer ${
                currentPath === '/' || currentPath === '/explore'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              Objevovat sauny
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/ceremonies');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground text-left cursor-pointer"
            >
              Ceremoniály
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/pridat-saunu');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground text-left cursor-pointer"
            >
              Přidat saunu
            </button>
            <div className="border-t border-border pt-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLocationOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground w-full text-left cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-primary">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {location.label}
              </button>
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};
