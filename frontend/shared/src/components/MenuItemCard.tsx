import React from 'react';
import type { IItemFieldColors, IItemFieldSizes, IItemFieldTags, CardPromotion } from '../display-types';

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function calcDiscounted(price: number, promo: CardPromotion): number {
  return promo.discount_type === 'percentage'
    ? price * (1 - promo.discount_value / 100)
    : Math.max(0, price - promo.discount_value);
}

export interface CardItemData {
  _id: string;
  name: string;
  image_url?: string;
  price: number;
  category?: { _id: string; name: string } | string | null;
}

export interface ResolvedCardSizes {
  category: string; // e.g. '0.88rem' (display) or '0.56em' (mock)
  name: string;
  price: string;
}

export interface MenuItemCardProps {
  item: CardItemData | null; // null = placeholder (shows index number)
  index: number;
  showCategory?: boolean;
  fieldColors?: IItemFieldColors;
  fieldSizes?: IItemFieldSizes;
  fieldTags?: IItemFieldTags;
  resolvedSizes: ResolvedCardSizes;
  /** Edit-mode controls rendered beside the category label */
  categoryControls?: React.ReactNode;
  /** Edit-mode controls rendered beside the name */
  nameControls?: React.ReactNode;
  /** Edit-mode controls rendered beside the price */
  priceControls?: React.ReactNode;
  /**
   * When true: renders the edit layout (name + controls | price + controls stacked).
   * When false: renders the display layout (name wraps 2 lines | price right-aligned) — matches live display exactly.
   */
  isEditing?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** CSS animation delay in ms — used by live display for staggered entry */
  animationDelay?: number;
  /** Active promotion for this item — renders badge + discounted price */
  promo?: CardPromotion | null;
  /** Click handlers for individual fields */
  onCategoryClick?: () => void;
  onNameClick?: () => void;
  onPriceClick?: () => void;
  /** Which field is currently selected for styling (itemId + fieldType) */
  selectedField?: { itemId: string; fieldType: 'category' | 'name' | 'price' } | null;
}

export function MenuItemCard({
  item,
  index,
  showCategory = true,
  fieldColors = {},
  fieldTags = {},
  resolvedSizes,
  categoryControls,
  nameControls,
  priceControls,
  isEditing = false,
  onMouseEnter,
  onMouseLeave,
  animationDelay,
  onCategoryClick,
  onNameClick,
  onPriceClick,
  selectedField,
  promo,
}: MenuItemCardProps) {
  const catColor   = fieldColors.category ?? '#ffffff';
  const nameColor  = fieldColors.name     ?? '#ffffff';
  const priceColor = fieldColors.price    ?? '#ffffff';

  const catTag   = fieldTags.category ?? true;
  const nameTag  = fieldTags.name     ?? false;
  const priceTag = fieldTags.price    ?? false;

  const catName =
    typeof item?.category === 'object' && item.category !== null
      ? item.category.name
      : typeof item?.category === 'string'
        ? item.category
        : '';

  const discountedPrice = item && promo ? calcDiscounted(item.price, promo) : null;
  const priceStr = item ? formatPrice(discountedPrice ?? item.price) : '$0.00';
  const letterFallback = item ? item.name[0].toUpperCase() : String(index + 1);

  const namePillStyle: React.CSSProperties = nameTag
    ? { background: `${nameColor}28`, border: `1px solid ${nameColor}44`, borderRadius: '8px', padding: '0.15em 0.5em', backdropFilter: 'blur(4px)' }
    : {};

  const pricePillStyle: React.CSSProperties = priceTag
    ? { background: `${priceColor}28`, border: `1px solid ${priceColor}44`, borderRadius: '8px', padding: '0.15em 0.5em', backdropFilter: 'blur(4px)' }
    : {};

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '16px',
        background: 'rgba(10,18,35,0.85)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        minHeight: 0,
        height: '100%',
        ...(animationDelay !== undefined
          ? { animation: 'cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both', animationDelay: `${animationDelay}ms` }
          : {}),
      }}
    >
      {/* ── Image area ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {item?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }}>
            <span style={{ fontWeight: 900, color: 'rgba(255,255,255,0.25)', fontSize: '2em' }}>
              {letterFallback}
            </span>
          </div>
        )}

        {/* Gradient fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', background: 'linear-gradient(to bottom, transparent, rgba(10,18,35,0.95))', pointerEvents: 'none' }} />

        {/* Promo badge */}
        {promo && (
          <span style={{
            position: 'absolute', top: '8px', right: '8px',
            fontSize: '0.7em', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em',
            background: promo.display_config.badge_color || '#ef4444',
            color: '#fff', borderRadius: '999px', padding: '1px 10px',
          }}>
            {promo.display_config.badge_text}
          </span>
        )}

        {/* Category pill + optional controls */}
        {showCategory && catName && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', zIndex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              onClick={(e) => { e.stopPropagation(); onCategoryClick?.(); }}
              style={{
                fontSize: resolvedSizes.category,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1.4,
                flexShrink: 0,
                cursor: onCategoryClick ? 'pointer' : 'default',
                ...(catTag
                  ? { color: catColor, background: `${catColor}28`, border: `1px solid ${catColor}44`, borderRadius: '999px', padding: '1px 10px', backdropFilter: 'blur(6px)' }
                  : { color: catColor }),
              }}
            >
              {catName}
            </span>
            {categoryControls}
          </div>
        )}
      </div>

      {/* ── Info section ────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, borderTop: 'solid 1px rgba(255,255,255,0.08)' }}>
        {!isEditing ? (
          /* ── Display layout: matches live display exactly ── */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', gap: '8px' }}>
            <span
              onClick={(e) => { e.stopPropagation(); onNameClick?.(); }}
              style={{
                fontWeight: 700,
                fontSize: resolvedSizes.name,
                lineHeight: 1.2,
                flex: 1,
                color: nameColor,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: onNameClick ? 'pointer' : 'default',
                ...namePillStyle,
              } as React.CSSProperties}
            >
              {item?.name ?? `Item ${index + 1}`}
            </span>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <span
                onClick={(e) => { e.stopPropagation(); onPriceClick?.(); }}
                style={{
                  display: 'block',
                  fontWeight: 900,
                  fontSize: resolvedSizes.price,
                  color: priceColor,
                  cursor: onPriceClick ? 'pointer' : 'default',
                  ...pricePillStyle
                }}
              >
                {priceStr}
              </span>
              {promo && discountedPrice !== null && item && (
                <span style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through', display: 'block' }}>
                  {formatPrice(item.price)}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* ── Edit layout: name row + price row with controls ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                onClick={(e) => { e.stopPropagation(); onNameClick?.(); }}
                style={{
                  fontWeight: 700,
                  fontSize: resolvedSizes.name,
                  color: nameColor,
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: onNameClick ? 'pointer' : 'default',
                  ...namePillStyle
                }}
              >
                {item?.name ?? `Item ${index + 1}`}
              </span>
              {nameControls}
            </div>
            {/* Price row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              {priceControls}
              <span
                onClick={(e) => { e.stopPropagation(); onPriceClick?.(); }}
                style={{
                  fontWeight: 900,
                  fontSize: resolvedSizes.price,
                  color: priceColor,
                  cursor: onPriceClick ? 'pointer' : 'default',
                  ...pricePillStyle
                }}
              >
                {priceStr}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
