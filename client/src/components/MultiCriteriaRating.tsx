import React from 'react';
import { Star, Sparkles, Droplets, Flame, Users, Coins } from 'lucide-react';

interface MultiCriteriaRatingProps {
  overall: number;
  cleanliness: number;
  heatSteam: number;
  cooling: number;
  staffCeremonies: number;
  value: number;
  reviewCount: number;
  className?: string;
}

export const MultiCriteriaRating: React.FC<MultiCriteriaRatingProps> = ({
  overall,
  cleanliness,
  heatSteam,
  cooling,
  staffCeremonies,
  value,
  reviewCount,
  className = '',
}) => {
  const criteria = [
    {
      label: 'Čistota prostředí a šaten',
      score: cleanliness,
      icon: Sparkles,
      color: 'bg-[#2D4A3E]',
    },
    {
      label: 'Kvalita tepla a páry',
      score: heatSteam,
      icon: Flame,
      color: 'bg-[#C26747]',
    },
    {
      label: 'Možnosti ochlazení',
      score: cooling,
      icon: Droplets,
      color: 'bg-sky-600',
    },
    {
      label: 'Personál a ceremoniály',
      score: staffCeremonies,
      icon: Users,
      color: 'bg-amber-600',
    },
    {
      label: 'Poměr cena / výkon',
      score: value,
      icon: Coins,
      color: 'bg-[#8C3D24]',
    },
  ];

  // Percentage equivalent for ČSFD feel (e.g. 4.5 / 5 = 90%)
  const overallPercent = Math.round((overall / 5) * 100);

  return (
    <div className={`p-6 rounded-xl bg-card border border-border shadow-sm ${className}`}>
      {/* Overall Score Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary text-primary-foreground font-display font-bold text-2xl shadow-sm">
            {overall > 0 ? overall.toFixed(1) : '–'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-accent mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(overall)
                      ? 'fill-[#e8a87c] text-[#e8a87c]'
                      : 'text-border'
                  }`}
                />
              ))}
              <span className="text-base font-display font-bold text-foreground ml-2">
                {overallPercent}% spokojenost
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Na základě {reviewCount} ověřených komunitních hodnocení
            </p>
          </div>
        </div>
      </div>

      {/* 5-Criteria Breakdown Bars */}
      <div className="mt-6 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Detailní hodnocení parametrů (ČSFD styl)
        </h4>

        {criteria.map((item) => {
          const Icon = item.icon;
          const pct = Math.min(100, Math.max(0, (item.score / 5) * 100));

          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-foreground font-medium">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {item.label}
                </span>
                <span className="font-bold text-foreground">
                  {item.score > 0 ? item.score.toFixed(1) : '–'} / 5.0
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
