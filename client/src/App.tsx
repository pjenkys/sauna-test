import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { FilterProvider } from './context/FilterContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { Footer } from './components/Footer';

// Pages
import { ExplorePage } from './pages/ExplorePage';
import { DetailPage } from './pages/DetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubmitSaunaPage } from './pages/SubmitSaunaPage';
import { CeremoniesPage } from './pages/CeremoniesPage';

export const App: React.FC = () => {
  const getInitialPath = () => {
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      return window.location.hash.slice(1);
    }
    let p = window.location.pathname.replace(/^\/sauna-test/, '') || '/';
    return p + window.location.search;
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);

  useEffect(() => {
    const handleNavigation = () => {
      if (window.location.hash && window.location.hash.startsWith('#/')) {
        setCurrentPath(window.location.hash.slice(1));
      } else {
        let p = window.location.pathname.replace(/^\/sauna-test/, '') || '/';
        setCurrentPath(p + window.location.search);
      }
    };
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const navigate = (to: string) => {
    if (to !== currentPath) {
      if (window.location.hostname.includes('github.io') || window.location.hash.startsWith('#/')) {
        window.location.hash = '#' + to;
      } else {
        window.history.pushState(null, '', to);
      }
      setCurrentPath(to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Route parser
  let pathname = currentPath.split('?')[0];
  if (pathname.startsWith('#/')) pathname = pathname.slice(1);
  pathname = pathname.replace(/^\/sauna-test/, '') || '/';
  if (!pathname.startsWith('/')) pathname = '/' + pathname;

  const renderCurrentPage = () => {
    // 1. Sauna Detail: /sauna/:slug
    if (pathname.startsWith('/sauna/')) {
      const slug = pathname.replace('/sauna/', '').replace(/\/$/, '');
      return (
        <div className="flex-1 pb-20 sm:pb-12">
          <DetailPage slug={slug} navigate={navigate} />
          <Footer navigate={navigate} />
        </div>
      );
    }

    // 2. Ceremonies Calendar: /ceremonies
    if (pathname === '/ceremonies') {
      return (
        <div className="flex-1 pb-20 sm:pb-12">
          <CeremoniesPage navigate={navigate} />
          <Footer navigate={navigate} />
        </div>
      );
    }

    // 3. Submit Proposal: /pridat-saunu
    if (pathname === '/pridat-saunu') {
      return (
        <div className="flex-1 pb-20 sm:pb-12">
          <SubmitSaunaPage navigate={navigate} />
          <Footer navigate={navigate} />
        </div>
      );
    }

    // 4. User Profile: /profil
    if (pathname === '/profil') {
      return (
        <div className="flex-1 pb-20 sm:pb-12">
          <ProfilePage navigate={navigate} />
          <Footer navigate={navigate} />
        </div>
      );
    }

    // Default: Figma Catalog Application (/ and /explore)
    return <ExplorePage navigate={navigate} />;
  };

  return (
    <AuthProvider>
      <LocationProvider>
        <FilterProvider>
          <FavoritesProvider>
            <div
              className="min-h-screen"
              style={{ background: 'var(--background)', color: 'var(--foreground)' }}
            >
              <Navbar currentPath={pathname} navigate={navigate} />
              {renderCurrentPage()}
              <BottomNav currentPath={pathname} navigate={navigate} />
              <PwaInstallPrompt />
            </div>
          </FavoritesProvider>
        </FilterProvider>
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;
