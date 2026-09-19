import React, { useState, useEffect } from 'react';
import { ShoppingBag, ExternalLink, Sparkles, Tag } from 'lucide-react';
import { api } from '../services/api';
import { AffiliatePartnerProduct } from '../types';

export const AffiliateGrid: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'Doporučené saunové vybavení',
  subtitle = 'Kvalitní vlněné čepice, přírodní esenciální oleje a kilty od ověřených českých partnerů',
}) => {
  const [products, setProducts] = useState<AffiliatePartnerProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getAffiliateProducts()
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setProducts(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load affiliate products', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProductClick = (product: AffiliatePartnerProduct) => {
    api.trackReferralClick({
      affiliate_product_id: product.id,
      click_type: 'affiliate_product',
      destination_url: product.affiliate_url,
    });
  };

  if (isLoading) {
    return (
      <div className="py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-56 rounded-xl bg-slate-900 border border-slate-800" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Etické partnerské tipy</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-normal text-[#1C1917] tracking-tight">{title}</h3>
          <p className="text-sm text-[#78716C] mt-1 max-w-xl font-normal">{subtitle}</p>
        </div>
        <span className="text-xs text-[#78716C] bg-[#F5F1E9] px-3.5 py-1.5 rounded-full border border-border font-medium">
          Transparentní sponzorované odkazy
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="group bg-white border border-border hover:border-[#C26747]/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-sm-hover shadow-sm flex flex-col justify-between hover:-translate-y-0.5"
          >
            <div className="relative h-48 w-full bg-[#F5F1E9] overflow-hidden">
              <img
                src={p.image_url}
                alt={p.product_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-medium text-[#1C1917] border border-border shadow-sm">
                {p.partner_shop_name}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-display text-sm font-semibold text-[#1C1917] group-hover:text-primary transition-colors line-clamp-1 mb-1.5">
                  {p.product_name}
                </h4>
                {p.description && (
                  <p className="text-xs text-[#78716C] line-clamp-2 mb-4">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="pt-3.5 border-t border-border flex items-center justify-between">
                <span className="text-base font-display font-bold text-[#1C1917]">
                  {p.price_czk} Kč
                </span>
                <a
                  href={p.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => handleProductClick(p)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
                >
                  <span>Koupit</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
