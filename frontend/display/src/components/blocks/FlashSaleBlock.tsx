'use client';

import { useState, useEffect } from 'react';
import type { ILayoutBanner, DisplayPromotion, DisplayMenuItem } from '../templates/types';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface FlashSaleBlockProps {
  layout: ILayoutBanner;
  promotion: DisplayPromotion;
  menuItems: DisplayMenuItem[];
  primary: string;
  promoCount: number;
  promoIndex: number;
}

export function FlashSaleBlock({
  layout,
  promotion,
  menuItems,
  primary,
  promoCount,
  promoIndex,
}: FlashSaleBlockProps) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!layout.visible) return null;

  const endMs = promotion.end_time ? new Date(promotion.end_time).getTime() : 0;
  const remaining = now !== null && endMs > now ? endMs - now : 0;

  const promoItem =
    promotion.applicable_items.length > 0
      ? menuItems.find((m) => promotion.applicable_items.includes(m._id))
      : null;

  const discountLabel =
    promotion.discount_type === 'percentage'
      ? `${promotion.discount_value}% OFF`
      : `$${promotion.discount_value} OFF`;

  const itemLabel = promoItem
    ? `${discountLabel} — ${promoItem.name.toUpperCase()}`
    : `${discountLabel} — ${promotion.name.toUpperCase()}`;

  const bannerBg = promotion.display_config.banner_image_url;
  const sideImg = promotion.display_config.side_image_url || promoItem?.image_url;

  return (
    <div
      className="flex-shrink-0 flex items-center gap-5 relative overflow-hidden rounded-2xl"
      style={{
        margin: layout.position === 'bottom' ? '0 16px 16px' : '16px 16px 0',
        padding: '16px 32px',
        background: bannerBg
          ? `url(${bannerBg}) center/cover no-repeat`
          : 'linear-gradient(90deg, #0f2460 0%, #1a3a8f 40%, #0f2460 100%)',
        border: `1px solid ${primary}40`,
        animation: 'bannerIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      {/* Dark overlay when background image is set */}
      {bannerBg && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(5,12,30,0.72)' }}
        />
      )}

      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 30%, ${primary}18 50%, transparent 70%)`,
          animation: 'shimmer 4s ease-in-out infinite',
        }}
      />

      {/* Side image */}
      {sideImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sideImg}
          alt=""
          className="relative z-10 rounded-2xl object-cover flex-shrink-0"
          style={{ width: '90px', height: '90px', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.6))' }}
        />
      )}

      {/* Text */}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span
            className="font-black uppercase tracking-widest"
            style={{ fontSize: '1.7rem', color: '#fbbf24', lineHeight: 1 }}
          >
            FLASH SALE!
          </span>
          <span
            className="text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0"
            style={{ background: promotion.display_config.badge_color || '#ef4444', color: '#fff' }}
          >
            {promotion.display_config.badge_text}
          </span>
        </div>
        <p
          className="text-white/75 font-bold uppercase tracking-wide truncate"
          style={{ fontSize: '0.9rem' }}
        >
          {itemLabel}
        </p>

        {promoCount > 1 && (
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: promoCount }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === promoIndex ? '16px' : '5px',
                  height: '5px',
                  background: i === promoIndex ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Countdown */}
      {remaining > 0 && (
        <div className="relative z-10 flex-shrink-0 flex flex-col items-center gap-1.5">
          <span
            className="text-xs font-black uppercase tracking-widest px-3 py-0.5 rounded-full"
            style={{ background: '#fbbf24', color: '#1a1200' }}
          >
            SALE ENDS IN
          </span>
          <span
            className="font-black tabular-nums"
            style={{ fontSize: '2.4rem', color: '#fff', letterSpacing: '3px', lineHeight: 1 }}
          >
            {formatCountdown(remaining)}
          </span>
        </div>
      )}
    </div>
  );
}
