'use client';

import type { ILayoutMain, DisplayMenuItem, DisplayPromotion, IItemFieldColors, IItemFieldSizes, IItemFieldTags } from '../templates/types';

// ── Size tokens ───────────────────────────────────────────────────────────────

const CAT_SIZES:   Record<string, string> = { xs: '0.62rem', sm: '0.75rem', md: '0.88rem', lg: '1.05rem' };
const NAME_SIZES:  Record<string, string> = { xs: '0.72rem', sm: '0.85rem', md: '1.0rem',  lg: '1.2rem'  };
const PRICE_SIZES: Record<string, string> = { xs: '0.80rem', sm: '1.0rem',  md: '1.15rem', lg: '1.4rem'  };

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function getCatName(category: DisplayMenuItem['category']): string {
  return typeof category === 'object' && category !== null ? category.name : String(category ?? '');
}

function calcDiscounted(item: DisplayMenuItem, promo: DisplayPromotion): number {
  return promo.discount_type === 'percentage'
    ? item.price * (1 - promo.discount_value / 100)
    : Math.max(0, item.price - promo.discount_value);
}

// ── Single item card ──────────────────────────────────────────────────────────

function ItemCard({
  item, promo, index, showCat, fieldColors, fieldSizes, fieldTags,
}: {
  item: DisplayMenuItem;
  promo: DisplayPromotion | null;
  index: number;
  showCat: boolean;
  fieldColors?: IItemFieldColors;
  fieldSizes?: IItemFieldSizes;
  fieldTags?: IItemFieldTags;
}) {
  const catColor   = fieldColors?.category ?? '#ffffff';
  const nameColor  = fieldColors?.name     ?? '#ffffff';
  const priceColor = fieldColors?.price    ?? '#ffffff';

  const catFontSize   = CAT_SIZES[fieldSizes?.category   ?? 'md'];
  const nameFontSize  = NAME_SIZES[fieldSizes?.name      ?? 'lg'];
  const priceFontSize = PRICE_SIZES[fieldSizes?.price    ?? 'lg'];

  const catName    = getCatName(item.category);
  const discounted = promo ? calcDiscounted(item, promo) : null;

  const catTag   = fieldTags?.category ?? true;
  const nameTag  = fieldTags?.name     ?? false;
  const priceTag = fieldTags?.price    ?? false;

  const namePillStyle  = nameTag  ? { background: `${nameColor}28`,  border: `1px solid ${nameColor}44`,  borderRadius: '8px',   padding: '0.15em 0.5em', backdropFilter: 'blur(4px)' } : {};
  const pricePillStyle = priceTag ? { background: `${priceColor}28`, border: `1px solid ${priceColor}44`, borderRadius: '8px',   padding: '0.15em 0.5em', backdropFilter: 'blur(4px)' } : {};

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: 'rgba(10,18,35,0.85)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        animation: 'cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
        animationDelay: `${index * 25}ms`,
      }}
    >
      {/* Image area */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover block" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }}>
            <span style={{ fontSize: '56px', fontWeight: 900, color: 'rgba(255,255,255,0.25)' }}>
              {item.name[0].toUpperCase()}
            </span>
          </div>
        )}

        {/* Gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: '48px', background: 'linear-gradient(to bottom, transparent, rgba(10,18,35,0.95))' }} />

        {/* Category pill */}
        {showCat && catName && (
          <span className="absolute top-2 left-2 font-bold"
            style={catTag ? {
              fontSize: catFontSize,
              background: `${catColor}28`,
              color: catColor,
              border: `1px solid ${catColor}44`,
              borderRadius: '999px',
              padding: '1px 10px',
              backdropFilter: 'blur(6px)',
            } : {
              fontSize: catFontSize,
              color: catColor,
              fontWeight: 700,
            }}
          >
            {catName}
          </span>
        )}

        {/* Promo badge */}
        {promo && (
          <span className="absolute top-2 right-2 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: promo.display_config.badge_color || '#ef4444', color: '#fff' }}>
            {promo.display_config.badge_text}
          </span>
        )}
      </div>

      {/* Info section */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="font-bold leading-tight line-clamp-2 flex-1"
          style={{ fontSize: nameFontSize, color: nameColor, ...namePillStyle }}>
          {item.name}
        </p>
        <div className="flex-shrink-0 text-right">
          <span className="font-black block"
            style={{ fontSize: priceFontSize, color: priceColor, ...pricePillStyle }}>
            {formatPrice(discounted ?? item.price)}
          </span>
          {promo && discounted !== null && (
            <span className="text-white/30 line-through" style={{ fontSize: '0.75rem' }}>
              {formatPrice(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MenuGridBlock ─────────────────────────────────────────────────────────────

interface MenuGridBlockProps {
  layout: ILayoutMain;
  items: DisplayMenuItem[];
  promotions: DisplayPromotion[];
  activePage: number;
  gridVisible: boolean;
  gridKey: number;
  hasBanner: boolean;
  itemColors?: Record<string, IItemFieldColors>;
  itemSizes?:  Record<string, IItemFieldSizes>;
  itemTags?:   Record<string, IItemFieldTags>;
}

export function MenuGridBlock({
  layout, items, promotions, activePage, gridVisible, gridKey, hasBanner,
  itemColors = {}, itemSizes = {}, itemTags = {},
}: MenuGridBlockProps) {
  const COLS = layout.columns ?? 3;
  const ROWS = layout.rows ?? 2;
  const capacity = COLS * ROWS;

  const offset = activePage * capacity;
  const visible = items.slice(offset, offset + capacity);

  return (
    <div
      className="flex-1 overflow-hidden"
      style={{
        padding: `16px 20px ${hasBanner ? '8px' : '16px'}`,
        transition: 'opacity 0.4s ease-in-out',
        opacity: gridVisible ? 1 : 0,
      }}
    >
      {visible.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-white/15 text-2xl font-bold tracking-wide">No items to display</p>
        </div>
      ) : (
        <div
          key={gridKey}
          className="h-full grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gap: '14px',
          }}
        >
          {visible.map((item, idx) => {
            const promo = promotions.find(
              (p) => p.applicable_items.length === 0 || p.applicable_items.includes(item._id),
            ) ?? null;
            return (
              <ItemCard
                key={item._id}
                item={item}
                promo={promo}
                index={idx}
                showCat={layout.show_category_label}
                fieldColors={itemColors[item._id]}
                fieldSizes={itemSizes[item._id]}
                fieldTags={itemTags[item._id]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
