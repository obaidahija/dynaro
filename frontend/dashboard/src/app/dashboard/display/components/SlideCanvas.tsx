'use client';

import React, { useState } from 'react';
import { MenuItemCard } from '@shared/components/MenuItemCard';
import { DisplayHeader } from '@shared/components/DisplayHeader';
import {
  ILayoutConfig, ILayoutHeader, ILayoutMain,
  IItemFieldColors, IItemFieldSizes, IItemFieldTags, IItemFieldImage,
  MOCK_CAT_SIZES, MOCK_NAME_SIZES, MOCK_PRICE_SIZES,
  SIZE_STEPS, SIZE_LABELS, BG_THEMES,
} from '@shared/display-types';

interface IMenuItem {
  _id: string;
  name: string;
  image_url?: string;
  price: number;
  is_active: boolean;
  category: { _id: string; name: string };
}

type Zone = 'header' | 'main' | 'banner' | null;

const BTN: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '26px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '11px',
  flexShrink: 0,
  userSelect: 'none',
};

// ── Canvas Mocks ──────────────────────────────────────────────────────────────

function HeaderMock({ layout, selected, onSelect }: { layout: ILayoutHeader; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: 'relative',
        cursor: 'pointer',
        outline: selected ? '2px solid #60a5fa' : '2px solid transparent',
        outlineOffset: '-2px',
        transition: 'outline-color 0.15s',
      }}
    >
      <DisplayHeader
        layout={layout}
        storeName="STORE NAME"
        primaryColor="#3B82F6"
        liveClock={false}
        mockSizes={true}
      />
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            background: '#3b82f6',
            color: '#fff',
            fontSize: '0.42em',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '3px',
            textTransform: 'uppercase',
            zIndex: 10,
          }}
        >
          Header
        </div>
      )}
    </div>
  );
}

function MainMock({
  layout,
  selected,
  onSelect,
  hasBanner,
  items,
  itemColors = {},
  itemSizes = {},
  itemTags = {},
  itemImages = {},
  selectedField,
  onSelectField,
  onRemoveItem,
  onReorderItems,
}: {
  layout: ILayoutMain;
  selected: boolean;
  onSelect: () => void;
  hasBanner: boolean;
  items: IMenuItem[];
  itemColors?: Record<string, IItemFieldColors>;
  itemSizes?: Record<string, IItemFieldSizes>;
  itemTags?: Record<string, IItemFieldTags>;
  itemImages?: Record<string, IItemFieldImage>;
  selectedField?: { itemId: string; fieldType: 'category' | 'name' | 'price' | 'image' } | null;
  onSelectField?: (field: { itemId: string; fieldType: 'category' | 'name' | 'price' | 'image' } | null) => void;
  onRemoveItem?: (itemId: string) => void;
  onReorderItems?: (newItems: IMenuItem[]) => void;
}) {
  const { columns, rows } = layout;
  const capacity = columns * rows;

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleFieldClick = (itemId: string, fieldType: 'category' | 'name' | 'price' | 'image') => {
    onSelect();
    onSelectField?.({ itemId, fieldType });
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        flex: 1,
        minHeight: 0,
        padding: `1.5% 2% ${hasBanner ? '0.5%' : '1.5%'}`,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '1%',
        cursor: 'pointer',
        outline: selected ? '2px solid #60a5fa' : '2px solid transparent',
        outlineOffset: '-2px',
        transition: 'outline-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: capacity }, (_, i) => {
        const item = items[i] ?? null;
        const perColor: IItemFieldColors = item && itemColors[item._id] ? itemColors[item._id] : {};
        const perSize: IItemFieldSizes = item && itemSizes[item._id] ? itemSizes[item._id] : {};
        const perTag: IItemFieldTags = item && itemTags[item._id] ? itemTags[item._id] : {};

        const resolvedSizes = {
          category: MOCK_CAT_SIZES[perSize.category ?? 'md'],
          name: MOCK_NAME_SIZES[perSize.name ?? 'lg'],
          price: MOCK_PRICE_SIZES[perSize.price ?? 'lg'],
        };

        return (
          <div
            key={i}
            className="group"
            draggable={!!item}
            onDragStart={(e) => {
              if (!item) { e.preventDefault(); return; }
              e.dataTransfer.effectAllowed = 'move';
              setDragIdx(i);
            }}
            onDragOver={(e) => {
              if (dragIdx === null || !item || dragIdx === i) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (overIdx !== i) setOverIdx(i);
            }}
            onDragLeave={() => setOverIdx(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== i && item) {
                const newItems = [...items];
                const [moved] = newItems.splice(dragIdx, 1);
                newItems.splice(i, 0, moved);
                onReorderItems?.(newItems);
              }
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            style={{
              position: 'relative',
              opacity: dragIdx === i ? 0.35 : 1,
              outline: overIdx === i && dragIdx !== i ? '2px solid #60a5fa' : '2px solid transparent',
              borderRadius: '16px',
              transition: 'outline-color 0.1s, opacity 0.15s',
            }}
          >
            <MenuItemCard
              item={item}
              index={i}
              showCategory={layout.show_category_label}
              fieldColors={perColor}
              fieldSizes={perSize}
              fieldTags={perTag}
              fieldImage={item && itemImages ? itemImages[item._id] : undefined}
              resolvedSizes={resolvedSizes}
              isEditing={false}
              selectedField={selectedField}
              onCategoryClick={() => item && handleFieldClick(item._id, 'category')}
              onNameClick={() => item && handleFieldClick(item._id, 'name')}
              onPriceClick={() => item && handleFieldClick(item._id, 'price')}
              onImageClick={() => item && handleFieldClick(item._id, 'image')}
            />
            {item && (
              <button
                type="button"
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                style={{ top: '-9px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,25,45,0.90)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', width: '32px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, backdropFilter: 'blur(4px)', padding: 0 }}
                title="Drag to reorder"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <svg width="16" height="6" viewBox="0 0 16 6" fill="none">
                  <path d="M2 1h12M2 5h12" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            {item && onRemoveItem && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemoveItem(item._id); }}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, backdropFilter: 'blur(2px)' }}
                title="Remove from slide"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 6M7 1L1 7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        );
      })}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            background: '#3b82f6',
            color: '#fff',
            fontSize: '0.42em',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '3px',
            textTransform: 'uppercase',
            zIndex: 10,
          }}
        >
          Grid
        </div>
      )}
    </div>
  );
}

function BannerMock({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        flexShrink: 0,
        height: '8%',
        background: 'linear-gradient(90deg, #0f2460 0%, #1a3a8f 40%, #0f2460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        outline: selected ? '2px solid #60a5fa' : '2px solid transparent',
        outlineOffset: '-2px',
        transition: 'outline-color 0.15s',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontSize: '0.62em',
          color: '#fff',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        🔥 FLASH SALE — SPECIAL OFFERS TODAY
      </span>
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            background: '#3b82f6',
            color: '#fff',
            fontSize: '0.42em',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '3px',
            textTransform: 'uppercase',
          }}
        >
          Banner
        </div>
      )}
    </div>
  );
}

// ── SlideCanvas Component ──────────────────────────────────────────────────────

export interface SlideCanvasProps {
  layout: ILayoutConfig;
  selectedZone: Zone;
  onSelectZone: (z: Zone) => void;
  items: IMenuItem[];
  itemColors?: Record<string, IItemFieldColors>;
  itemSizes?: Record<string, IItemFieldSizes>;
  itemTags?: Record<string, IItemFieldTags>;
  itemImages?: Record<string, IItemFieldImage>;
  selectedField?: { itemId: string; fieldType: 'category' | 'name' | 'price' | 'image' } | null;
  onSelectField?: (field: { itemId: string; fieldType: 'category' | 'name' | 'price' | 'image' } | null) => void;
  onRemoveItem?: (itemId: string) => void;
  onReorderItems?: (newItems: IMenuItem[]) => void;
}

export function SlideCanvas({
  layout,
  selectedZone,
  onSelectZone,
  items,
  itemColors,
  itemSizes,
  itemTags,
  itemImages,
  selectedField,
  onSelectField,
  onRemoveItem,
  onReorderItems,
}: SlideCanvasProps) {
  const bg = BG_THEMES[layout.bg_theme ?? 'dark'].gradient;

  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ background: bg, display: 'flex', flexDirection: 'column', fontSize: '16px' }}
      onClick={() => onSelectZone(null)}
    >
      {layout.banner.visible && layout.banner.position === 'top' && (
        <BannerMock selected={selectedZone === 'banner'} onSelect={() => onSelectZone('banner')} />
      )}
      {layout.header.visible && (
        <HeaderMock layout={layout.header} selected={selectedZone === 'header'} onSelect={() => onSelectZone('header')} />
      )}
      <MainMock
        layout={layout.main}
        selected={selectedZone === 'main'}
        onSelect={() => onSelectZone('main')}
        hasBanner={layout.banner.visible}
        items={items}
        itemColors={itemColors}
        itemSizes={itemSizes}
        itemTags={itemTags}
        itemImages={itemImages}
        selectedField={selectedField}
        onSelectField={onSelectField}
        onRemoveItem={onRemoveItem}
        onReorderItems={onReorderItems}
      />
      {layout.banner.visible && layout.banner.position === 'bottom' && (
        <BannerMock selected={selectedZone === 'banner'} onSelect={() => onSelectZone('banner')} />
      )}
    </div>
  );
}
