import { MenuItemCard } from '@shared/components/MenuItemCard';
import { DISPLAY_CAT_SIZES, DISPLAY_NAME_SIZES, DISPLAY_PRICE_SIZES } from '@shared/display-types';
import type { IItemFieldColors, IItemFieldSizes, IItemFieldTags } from '@shared/display-types';
import type { ILayoutMain, DisplayMenuItem, DisplayPromotion } from '../templates/types';

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
            const perSizes = itemSizes[item._id];
            const resolvedSizes = {
              category: DISPLAY_CAT_SIZES[perSizes?.category ?? 'md'],
              name:     DISPLAY_NAME_SIZES[perSizes?.name    ?? 'lg'],
              price:    DISPLAY_PRICE_SIZES[perSizes?.price  ?? 'lg'],
            };
            return (
              <MenuItemCard
                key={item._id}
                item={item}
                promo={promo}
                index={idx}
                showCategory={layout.show_category_label}
                fieldColors={itemColors[item._id]}
                fieldSizes={perSizes}
                fieldTags={itemTags[item._id]}
                resolvedSizes={resolvedSizes}
                isEditing={false}
                animationDelay={idx * 25}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
