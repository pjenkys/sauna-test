import React from 'react';
import { Flame, Compass, Calendar, PlusCircle, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, navigate }) => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Domů', path: '/', icon: Flame },
    { label: 'Objevovat', path: '/explore', icon: Compass },
    { label: 'Ceremoniály', path: '/ceremonies', icon: Calendar },
    { label: 'Přidat', path: '/pridat-saunu', icon: PlusCircle },
    { label: user ? 'Profil' : 'Účet', path: '/profil', icon: UserIcon },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-sm">
      <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center py-1 group cursor-pointer focus:outline-none"
            >
              <div
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground group-hover:text-foreground group-hover:bg-muted'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground stroke-[2.2]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive
                    ? 'font-bold text-foreground'
                    : 'font-medium text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
