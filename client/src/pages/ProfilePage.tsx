import React, { useState } from 'react';
import {
  User as UserIcon,
  Heart,
  Bookmark,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Star,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { UserListTypeCode } from '../types';

interface ProfilePageProps {
  navigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { lists, toggleList } = useFavorites();
  const [activeTab, setActiveTab] = useState<UserListTypeCode>('favorite');

  const currentList = lists[activeTab] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-background">
      {/* Profile Header */}
      <div className="p-7 sm:p-8 rounded-xl bg-white border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-18 h-18 rounded-xl bg-primary text-white flex items-center justify-center font-display font-bold text-3xl shadow-sm">
            {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-display font-normal text-[#1C1917]">
                {user?.display_name || 'Host (Anonymní profil)'}
              </h1>
              {user?.role && (
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {user.role}
                </span>
              )}
            </div>
            <p className="text-xs text-[#78716C] font-normal">
              {user ? user.email : 'Oblíbená místa jsou dočasně uložena v tomto prohlížeči.'}
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4 text-center">
            <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border">
              <div className="text-xl font-display font-bold text-[#1C1917]">{user.reviews_count || 0}</div>
              <div className="text-[11px] text-[#78716C] font-medium">Napsaných recenzí</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border">
              <div className="text-xl font-display font-bold text-primary">{user.helpful_votes_received || 0}</div>
              <div className="text-[11px] text-[#78716C] font-medium">Udělených hlasů</div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Lists Section */}
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-3 border-b border-border pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('favorite')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'favorite'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F1E9]'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'favorite' ? 'fill-[#C26747] text-primary' : 'text-[#78716C]'}`} />
            <span>Oblíbené sauny ({lists.favorite.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('want_to_visit')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'want_to_visit'
                ? 'bg-[#E6EFEA] text-[#14221C] border border-[#C9DCD2] shadow-sm font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F1E9]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${activeTab === 'want_to_visit' ? 'fill-[#2D4A3E] text-[#2D4A3E]' : 'text-[#78716C]'}`} />
            <span>Chci navštívit ({lists.want_to_visit.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('visited')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'visited'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F1E9]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>Navštíveno ({lists.visited.length})</span>
          </button>
        </div>

        {/* List Content */}
        {currentList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentList.map((entry) => (
              <div
                key={entry.list_entry_id || entry.id}
                className="group relative bg-white border border-border hover:border-[#C26747]/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-sm-hover shadow-sm flex flex-col justify-between hover:-translate-y-0.5"
              >
                <div className="relative h-48 w-full bg-[#F5F1E9] overflow-hidden">
                  <img
                    src={entry.cover_image_url}
                    alt={entry.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

                  <button
                    onClick={() => toggleList({ id: entry.id }, activeTab)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/85 backdrop-blur-sm hover:bg-red-500 hover:text-white text-[#78716C] transition-colors cursor-pointer shadow-sm border border-border"
                    title="Odebrat ze seznamu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-display font-semibold text-[#1C1917] text-base group-hover:text-primary transition-colors line-clamp-1">
                        {entry.name}
                      </h3>
                      <div className="flex items-center gap-1 text-primary text-xs font-bold shrink-0 bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{entry.rating_overall > 0 ? entry.rating_overall.toFixed(1) : '–'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#78716C] mb-4">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{entry.address_city}</span>
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-[#A8A29E]">
                      Uloženo:{' '}
                      {entry.added_at ? new Date(entry.added_at).toLocaleDateString('cs-CZ') : 'Nedávno'}
                    </span>
                    <button
                      onClick={() => navigate(`/sauna/${entry.slug}`)}
                      className="text-xs font-semibold text-primary hover:text-primary flex items-center gap-1 cursor-pointer"
                    >
                      <span>Detail</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-xl bg-white border border-border text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-semibold text-[#1C1917]">V tomto seznamu zatím nic nemáte</h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Procházejte sauny v katalogu a ukládejte si oblíbená místa jediným kliknutím na ikonu srdce
              nebo záložky.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-7 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
            >
              Prozkoumat sauny
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
