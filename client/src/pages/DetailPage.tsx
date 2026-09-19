import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Star,
  Heart,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Droplets,
  Flame,
  Clock,
  Coins,
  ShieldCheck,
  Calendar,
  Building2,
  ExternalLink,
  ThumbsUp,
  Info,
  Thermometer,
  Camera,
} from 'lucide-react';
import { MultiCriteriaRating } from '../components/MultiCriteriaRating';
import { ReviewModal } from '../components/ReviewModal';
import { ClaimModal } from '../components/ClaimModal';
import { AffiliateGrid } from '../components/AffiliateGrid';
import { SaunaMap } from '../components/SaunaMap';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getDiverseSaunaPhoto } from '../utils/saunaImages';
import {
  SaunaDetail,
  VENUE_CATEGORY_LABELS,
  MULTISPORT_BENEFIT_LABELS,
  NUDITY_POLICY_LABELS,
  CEREMONY_CATEGORY_LABELS,
  CeremonyCategoryCode,
} from '../types';

interface DetailPageProps {
  slug: string;
  navigate: (path: string) => void;
}

const DAYS_CZ = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];

export const DetailPage: React.FC<DetailPageProps> = ({ slug, navigate }) => {
  const { isFavorite, isWantToVisit, isVisited, toggleList } = useFavorites();
  const { user } = useAuth();

  const [sauna, setSauna] = useState<SaunaDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  const loadSauna = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getSaunaDetail(slug);
      if (res.success && res.data) {
        setSauna(res.data);
      } else {
        setError('Sauna nebyla nalezena');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání detailu sauny');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadSauna();
  }, [loadSauna]);

  const handleHelpfulVote = async (reviewId: string) => {
    if (!user) {
      alert('Pro hlasování o užitečnosti recenze se prosím přihlaste.');
      return;
    }
    if (votedReviews[reviewId]) return;

    try {
      await api.voteReviewHelpful(reviewId);
      setVotedReviews((prev) => ({ ...prev, [reviewId]: true }));
      // Reload reviews
      loadSauna();
    } catch (err: any) {
      alert(err.message || 'Hlasování se nezdařilo');
    }
  };

  const handleBookingClick = () => {
    if (sauna?.booking_url) {
      api.trackReferralClick({
        venue_id: sauna.id,
        click_type: 'venue_booking_url',
        destination_url: sauna.booking_url,
      });
    }
  };

  const handleWebsiteClick = () => {
    if (sauna?.website_url) {
      api.trackReferralClick({
        venue_id: sauna.id,
        click_type: 'venue_website',
        destination_url: sauna.website_url,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="h-96 w-full bg-slate-900 rounded-xl" />
        <div className="h-40 w-full bg-slate-900 rounded-xl" />
      </div>
    );
  }

  if (error || !sauna) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-on-surface mb-3">Sauna nebyla nalezena</h2>
        <p className="text-sm text-on-surface-variant mb-6">{error || 'Požadovaný profil sauny neexistuje.'}</p>
        <button
          onClick={() => navigate('/explore')}
          className="px-7 py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-medium text-xs shadow-elevation-1 cursor-pointer"
        >
          Zpět na vyhledávač
        </button>
      </div>
    );
  }

  const catInfo = VENUE_CATEGORY_LABELS[sauna.category];
  const msRule = sauna.multisport;
  const msInfo = msRule?.benefit_type ? MULTISPORT_BENEFIT_LABELS[msRule.benefit_type] : null;
  const fav = isFavorite(sauna.id);
  const want = isWantToVisit(sauna.id);
  const visited = isVisited(sauna.id);

  // Diverse sauna gallery set
  const fallbackGallery = [
    getDiverseSaunaPhoto(`${sauna.id}-1`, 1200),
    getDiverseSaunaPhoto(`${sauna.id}-2`, 800),
    getDiverseSaunaPhoto(`${sauna.id}-3`, 800),
    getDiverseSaunaPhoto(`${sauna.id}-4`, 800),
  ];
  const gallery = [
    sauna.cover_image_url || getDiverseSaunaPhoto(sauna.id, 1200),
    ...(sauna.gallery_urls || []),
    ...fallbackGallery,
  ].slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 bg-background">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/explore')}
          className="flex items-center gap-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na katalog saun</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Oblíbené (Boutique Assist Chip) */}
          <button
            onClick={() => toggleList(sauna, 'favorite')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-sm ${
              fav
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-white text-[#1C1917] border-border hover:bg-[#F5F1E9]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-[#C26747] text-primary' : 'text-[#A8A29E]'}`} />
            <span>{fav ? 'V oblíbených' : 'Oblíbené'}</span>
          </button>

          {/* Chci navštívit */}
          <button
            onClick={() => toggleList(sauna, 'want_to_visit')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-sm ${
              want
                ? 'bg-[#E6EFEA] text-[#14221C] border-[#C9DCD2]'
                : 'bg-white text-[#1C1917] border-border hover:bg-[#F5F1E9]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${want ? 'fill-[#2D4A3E] text-[#2D4A3E]' : 'text-[#A8A29E]'}`} />
            <span>{want ? 'Chci navštívit' : 'Uložit'}</span>
          </button>

          {/* Navštíveno */}
          <button
            onClick={() => toggleList(sauna, 'visited')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-sm ${
              visited
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-white text-[#1C1917] border-border hover:bg-[#F5F1E9]'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${visited ? 'text-primary' : 'text-[#A8A29E]'}`} />
            <span>{visited ? 'Navštíveno' : 'Mám navštíveno'}</span>
          </button>

          {/* Operator Claim Profile Button */}
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#F5F1E9] border border-border text-xs font-medium text-[#1C1917] transition-colors cursor-pointer shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Nárokovat profil</span>
          </button>
        </div>
      </div>

      {/* Header Info: Title, Badges & Booking Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F5F1E9] text-[#1C1917] border border-border">
              {catInfo?.cz || sauna.category}
            </span>

            {sauna.is_verified_partner && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Ověřený provozovatel
              </span>
            )}

            {sauna.is_promoted && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {sauna.promoted_badge || 'Výběr kurátora'}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-normal text-[#1C1917] tracking-tight">
            {sauna.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#78716C] font-normal">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              {sauna.address_street}, {sauna.address_city}
            </span>
            {sauna.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#A8A29E] shrink-0" />
                {sauna.phone}
              </span>
            )}
            <span className="flex items-center gap-1 font-medium text-[#1C1917]">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {sauna.rating_overall > 0 ? sauna.rating_overall.toFixed(1) : '–'}
              <span className="text-[#78716C] font-normal">({sauna.review_count} recenzí)</span>
            </span>
          </div>
        </div>

        {/* Quick Action: Booking & Website (Boutique Buttons) */}
        <div className="flex items-center gap-3 shrink-0">
          {sauna.booking_url && (
            <a
              href={sauna.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleBookingClick}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-sm hover:shadow-sm-hover transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Rezervovat online</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {sauna.website_url && (
            <a
              href={sauna.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWebsiteClick}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#F5F1E9] border border-border text-[#1C1917] font-medium text-xs shadow-sm transition-colors flex items-center gap-2"
            >
              <Globe className="w-3.5 h-3.5 text-[#A8A29E]" />
              <span>Oficiální web</span>
            </a>
          )}
        </div>
      </div>

      {/* Mobile Photo Gallery with Counter & Thumbnail Carousel (< md) */}
      <div className="md:hidden space-y-2.5">
        <div className="relative h-64 sm:h-80 w-full rounded-xl overflow-hidden bg-surface-container-high shadow-elevation-1 border border-outline-variant/60">
          <img
            src={gallery[activePhotoIdx]}
            alt={`${sauna.name} - foto ${activePhotoIdx + 1}`}
            className="w-full h-full object-cover transition-all duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackGallery[activePhotoIdx % fallbackGallery.length];
            }}
          />
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
            <Camera className="w-3.5 h-3.5" />
            <span>{activePhotoIdx + 1} / {gallery.length}</span>
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {gallery.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setActivePhotoIdx(idx)}
              className={`relative w-16 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                activePhotoIdx === idx ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-outline-variant/60 opacity-70'
              }`}
            >
              <img
                src={imgUrl}
                alt={`Náhled ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackGallery[idx % fallbackGallery.length];
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Amazing Places 5-Photo Gallery Grid (>= md) */}
      <div className="hidden md:grid md:grid-cols-4 gap-3 rounded-xl overflow-hidden shadow-sm border border-border">
        {/* Main Large Photo (2 cols wide, 2 rows tall) */}
        <div className="md:col-span-2 md:row-span-2 relative md:h-[480px] overflow-hidden group bg-[#F5F1E9]">
          <img
            src={gallery[0]}
            alt={`${sauna.name} - hlavní pohled`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackGallery[0];
            }}
          />
        </div>

        {/* 4 Supporting Photos */}
        {gallery.slice(1, 5).map((imgUrl, idx) => (
          <div key={idx} className="relative md:h-[234px] overflow-hidden group bg-[#F5F1E9]">
            <img
              src={imgUrl}
              alt={`${sauna.name} - detail ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackGallery[idx % fallbackGallery.length];
              }}
            />
          </div>
        ))}
      </div>

      {/* MultiSport Comprehensive Rules Callout (Boutique Card) */}
      {msRule && msInfo && (
        <div className="p-8 sm:p-10 rounded-xl bg-white border border-border shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#E6EFEA] text-[#14221C] border border-[#C9DCD2] flex items-center justify-center font-display font-bold text-xl">
                MS
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Podmínky karty MultiSport
                </span>
                <h3 className="text-xl font-display font-semibold text-[#1C1917] mt-0.5">{msInfo.cz}</h3>
              </div>
            </div>

            <div className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#E6EFEA] text-[#14221C] border border-[#C9DCD2]">
              {msInfo.badge}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-xs">
            <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border">
              <span className="text-[#78716C] block mb-1">Doba vstupu zdarma:</span>
              <strong className="text-[#1C1917] text-sm font-semibold">
                {msRule.time_limit_minutes ? `${msRule.time_limit_minutes} minut` : 'Neomezeně'}
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border">
              <span className="text-[#78716C] block mb-1">Případný doplatek na vstupu:</span>
              <strong className="text-[#1C1917] text-sm font-semibold">
                {msRule.entry_surcharge_czk ? `${msRule.entry_surcharge_czk} Kč` : '0 Kč (Bez doplatku)'}
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border">
              <span className="text-[#78716C] block mb-1">Doplatek za překročení limitu:</span>
              <strong className="text-[#1C1917] text-sm font-semibold">
                {msRule.overtime_surcharge_per_block_czk
                  ? `${msRule.overtime_surcharge_per_block_czk} Kč / ${msRule.overtime_block_minutes || 15} min`
                  : 'Dle běžného ceníku'}
              </strong>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border">
              <span className="text-[#78716C] block mb-1">Ručníkový servis v ceně:</span>
              <strong className="text-[#1C1917] text-sm font-semibold">
                {msRule.towel_sheet_service_included ? 'Ano (prostěradlo zdarma)' : 'Ne (za poplatek / vlastní)'}
              </strong>
            </div>
          </div>

          {msRule.note && (
            <div className="mt-5 p-4 rounded-xl bg-[#F5F1E9] border border-border text-xs text-[#1C1917] flex items-start gap-2.5">
              <Info className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span><strong className="font-semibold">Poznámka k MultiSportu:</strong> {msRule.note}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left column (Description & Inventories) + Right column (Hours, Pricing, Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="p-8 rounded-xl bg-white border border-border shadow-sm space-y-4">
            <h3 className="text-2xl font-display font-normal text-[#1C1917] flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-primary" />
              O saunovém centru
            </h3>
            <p className="text-sm text-[#78716C] leading-relaxed whitespace-pre-line">
              {sauna.description}
            </p>

            {/* Operating policies highlights */}
            {sauna.policies && (
              <div className="pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#1C1917]">
                <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border">
                  <span className="text-[#78716C] block mb-1">Pravidla nošení plavek:</span>
                  <strong className="text-[#1C1917] font-semibold">
                    {NUDITY_POLICY_LABELS[sauna.policies.nudity_policy]?.cz || sauna.policies.nudity_policy}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border">
                  <span className="text-[#78716C] block mb-1">Parkování u areálu:</span>
                  <strong className="text-[#1C1917] font-semibold">
                    {sauna.policies.parking_notes || sauna.policies.parking_policy}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Cooling Options with Water Temperatures */}
          <div className="p-8 rounded-xl bg-white border border-border shadow-sm space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Ochlazovací zóna
              </span>
              <h3 className="text-2xl font-display font-normal text-[#1C1917] mt-1 flex items-center gap-2.5">
                <Droplets className="w-5 h-5 text-primary" />
                Možnosti ochlazení & teploty vody
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sauna.cooling_options?.map((co) => (
                <div
                  key={co.id}
                  className="p-4 rounded-xl bg-[#F5F1E9] border border-border flex items-start justify-between gap-3"
                >
                  <div>
                    <h4 className="font-semibold text-[#1C1917] text-sm mb-1">{co.name_cz}</h4>
                    {co.description && (
                      <p className="text-xs text-[#78716C] leading-relaxed">{co.description}</p>
                    )}
                  </div>

                  {co.water_temperature_celsius !== null && co.water_temperature_celsius !== undefined && (
                    <div className="shrink-0 px-2.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 font-semibold text-xs flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-sky-700" />
                      <span>{co.water_temperature_celsius} °C</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sauna Inventory */}
          <div className="p-8 rounded-xl bg-white border border-border shadow-sm space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Prohřívárny & rituální sály
              </span>
              <h3 className="text-2xl font-display font-normal text-[#1C1917] mt-1 flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-primary" />
                Dostupné sauny v areálu
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sauna.saunas?.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-[#F5F1E9] border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#1C1917] text-sm">{s.custom_name}</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                      {s.temperature_celsius_min}–{s.temperature_celsius_max} °C
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C]">{s.name_cz}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-[#78716C] pt-1">
                    <span>Vlhkost: {s.humidity_percentage_min}–{s.humidity_percentage_max} %</span>
                    {s.capacity_persons && <span>• Kapacita: {s.capacity_persons} osob</span>}
                    {s.wood_type && <span>• Dřevo: {s.wood_type}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ceremonies Schedule if available */}
          {sauna.ceremonies && sauna.ceremonies.length > 0 && (
            <div className="p-8 rounded-xl bg-white border border-border shadow-sm space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Zážitkové ceremoniály
                </span>
                <h3 className="text-2xl font-display font-normal text-[#1C1917] mt-1 flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-primary" />
                  Program saunových rituálů
                </h3>
              </div>

              <div className="space-y-3">
                {sauna.ceremonies.map((c) => {
                  const catLabel = CEREMONY_CATEGORY_LABELS[c.category as CeremonyCategoryCode]?.cz || c.category;
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-[#F5F1E9] border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                            {c.start_time} – {c.end_time}
                          </span>
                          <span className="text-xs text-[#78716C]">
                            {c.day_of_week !== null && c.day_of_week !== undefined
                              ? DAYS_CZ[c.day_of_week]
                              : 'Denně'}
                          </span>
                          <span className="text-xs text-[#1C1917] font-medium">({catLabel})</span>
                        </div>
                        <h4 className="font-semibold text-[#1C1917] text-sm">{c.title}</h4>
                        <p className="text-xs text-[#78716C] mt-1">{c.description}</p>
                      </div>

                      {c.ceremony_master && (
                        <div className="text-xs text-[#1C1917] shrink-0 bg-white px-3.5 py-1.5 rounded-full border border-border shadow-sm">
                          Saunér: <strong className="font-semibold">{c.ceremony_master}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Hours, Pricing, Mini-Map */}
        <div className="space-y-6">
          {/* Opening Hours */}
          <div className="p-6 rounded-xl bg-white border border-border shadow-sm space-y-4">
            <h3 className="text-base font-display font-semibold text-[#1C1917] flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Otevírací doba
            </h3>

            <div className="space-y-2 text-xs">
              {sauna.opening_hours?.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                >
                  <span className="text-[#78716C]">{DAYS_CZ[h.day_of_week]}</span>
                  <span className="font-medium text-[#1C1917]">
                    {h.is_closed ? 'Zavřeno' : `${h.open_time} – ${h.close_time}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="p-6 rounded-xl bg-white border border-border shadow-sm space-y-4">
            <h3 className="text-base font-display font-semibold text-[#1C1917] flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              Ceník vstupného
            </h3>

            <div className="space-y-2.5 text-xs">
              {sauna.pricing?.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-[#F5F1E9] border border-border flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-[#1C1917]">{p.ticket_name}</div>
                    <div className="text-[#78716C] text-[11px]">
                      {p.duration_minutes ? `${p.duration_minutes} minut` : 'Časově neomezený'}
                    </div>
                  </div>
                  <div className="text-sm font-display font-bold text-[#1C1917]">{p.price_czk} Kč</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini-Map */}
          <div className="p-6 rounded-xl bg-white border border-border shadow-sm space-y-3">
            <h3 className="text-base font-display font-semibold text-[#1C1917] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Poloha na mapě
            </h3>

            <div className="h-56 rounded-xl overflow-hidden border border-border">
              <SaunaMap
                markers={[
                  {
                    id: sauna.id,
                    name: sauna.name,
                    slug: sauna.slug,
                    category: sauna.category,
                    latitude: sauna.latitude,
                    longitude: sauna.longitude,
                    rating_overall: sauna.rating_overall,
                    review_count: sauna.review_count,
                    is_promoted: sauna.is_promoted,
                    promoted_badge: sauna.promoted_badge,
                    address_city: sauna.address_city,
                  },
                ]}
                center={[sauna.latitude, sauna.longitude]}
                zoom={14}
                onSelectSauna={() => {}}
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-[#78716C] text-center pt-1">
              {sauna.address_street}, {sauna.address_city}, {sauna.address_zip}
            </p>
          </div>
        </div>
      </div>

      {/* ČSFD-style 5-Criteria Ratings & Community Reviews */}
      <section className="space-y-6 pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display font-normal text-[#1C1917] tracking-tight">
              Komunitní hodnocení a recenze (ČSFD styl)
            </h2>
            <p className="text-sm text-[#78716C] mt-1">
              Vícedimenzionální hodnocení od reálných návštěvníků
            </p>
          </div>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
          >
            Napsat vlastní recenzi
          </button>
        </div>

        {/* Multi-criteria Breakdown Display */}
        <MultiCriteriaRating
          overall={sauna.rating_overall}
          cleanliness={sauna.rating_cleanliness}
          heatSteam={sauna.rating_heat_steam}
          cooling={sauna.rating_cooling}
          staffCeremonies={sauna.rating_staff_ceremonies}
          value={sauna.rating_value}
          reviewCount={sauna.review_count}
        />

        {/* List of Published Reviews */}
        <div className="space-y-4">
          {sauna.reviews && sauna.reviews.length > 0 ? (
            sauna.reviews.map((r) => (
              <div
                key={r.id}
                className="p-6 sm:p-8 rounded-xl bg-white border border-border shadow-sm space-y-4"
              >
                {/* Header: User, Date, Rating */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#F5F1E9] text-[#1C1917] border border-border flex items-center justify-center font-display font-bold text-sm">
                      {r.user_name ? r.user_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1C1917] text-sm flex items-center gap-2">
                        <span>{r.user_name || 'Uživatel'}</span>
                        {r.user_role === 'partner' && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                            Partner
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#78716C]">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('cs-CZ') : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{r.rating_overall} / 5</span>
                  </div>
                </div>

                {/* Title & Body */}
                <h4 className="font-display font-semibold text-[#1C1917] text-base">{r.title}</h4>
                <p className="text-sm text-[#78716C] leading-relaxed whitespace-pre-line">
                  {r.content}
                </p>

                {/* User Tip if provided */}
                {r.tips && (
                  <div className="p-4 rounded-xl bg-[#F5F1E9] border border-border text-xs text-[#1C1917]">
                    <strong className="text-primary font-semibold">Uživatelský tip: </strong>
                    {r.tips}
                  </div>
                )}

                {/* Helpful Vote Footer */}
                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-[#78716C]">
                  <span>
                    Byl tento komentář užitečný? ({r.helpful_votes_count || 0} hlasů)
                  </span>
                  <button
                    onClick={() => handleHelpfulVote(r.id)}
                    disabled={votedReviews[r.id]}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      votedReviews[r.id]
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-white text-[#1C1917] border-border hover:bg-[#F5F1E9]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{votedReviews[r.id] ? 'Uděleno' : 'Užitečné'}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 rounded-xl bg-white border border-border text-center text-sm text-[#78716C] shadow-sm">
              Pro tuto saunu zatím nikdo nenapsal recenzi. Buďte první, kdo se podělí o zkušenosti!
            </div>
          )}
        </div>
      </section>

      {/* Affiliate recommendations section */}
      <AffiliateGrid title="Doplňky pro vaši další návštěvu sauny" />

      {/* Modals */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        venueId={sauna.id}
        venueName={sauna.name}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={loadSauna}
      />

      <ClaimModal
        isOpen={isClaimModalOpen}
        venueId={sauna.id}
        venueName={sauna.name}
        onClose={() => setIsClaimModalOpen(false)}
      />
    </div>
  );
};
