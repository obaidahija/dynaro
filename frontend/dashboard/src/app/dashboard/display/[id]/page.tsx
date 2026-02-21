'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { playlistApi, menuApi, categoryApi } from '@/lib/api';
import {
  PlusIcon, TrashIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon,
  CheckIcon, TvIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { MenuItemCard } from '@shared/components/MenuItemCard';
import { DisplayHeader } from '@shared/components/DisplayHeader';
import {
  ILayoutHeader, ILayoutMain, ILayoutBanner, ILayoutConfig,
  IItemFieldColors, IItemFieldSizes, IItemFieldTags,
  MOCK_CAT_SIZES, MOCK_NAME_SIZES, MOCK_PRICE_SIZES,
  SIZE_STEPS, SIZE_LABELS, BG_THEMES,
} from '@shared/display-types';

// ── Local types ───────────────────────────────────────────────────────────────

interface IMenuItem {
  _id: string; name: string; image_url?: string; price: number; is_active: boolean;
  category: { _id: string; name: string };
}
interface ICategory { _id: string; name: string; sort_order: number; }

interface IPlaylistSlide {
  _id?: string;
  label: string;
  item_ids: string[];
  duration_sec: number;
  layout: ILayoutConfig;
  item_colors?: Record<string, IItemFieldColors>;
  item_sizes?:  Record<string, IItemFieldSizes>;
  item_tags?:   Record<string, IItemFieldTags>;
}

interface IPlaylist {
  _id: string;
  name: string;
  slides: IPlaylistSlide[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_LAYOUT: ILayoutConfig = {
  header: { visible: true, show_logo: true, show_name: true, show_clock: true },
  main: { type: 'menu-grid', columns: 3, rows: 2, show_category_label: true },
  banner: { visible: true, position: 'bottom' },
  bg_theme: 'dark',
};

type Zone = 'header' | 'main' | 'banner' | null;

// ── Canvas mocks ──────────────────────────────────────────────────────────────

function HeaderMock({ layout, selected, onSelect }: { layout: ILayoutHeader; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{ position: 'relative', cursor: 'pointer', outline: selected ? '2px solid #60a5fa' : '2px solid transparent', outlineOffset: '-2px', transition: 'outline-color 0.15s' }}
    >
      <DisplayHeader
        layout={layout}
        storeName="STORE NAME"
        primaryColor="#3B82F6"
        liveClock={false}
        mockSizes={true}
      />
      {selected && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#3b82f6', color: '#fff', fontSize: '0.42em', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase', zIndex: 10 }}>Header</div>}
    </div>
  );
}

const BTN: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '26px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '11px', flexShrink: 0, userSelect: 'none' };

function ColorDot({ color, field, itemId, onChange }: { color: string; field: string; itemId: string; onChange: (id: string, field: string, c: string) => void }) {
  return (
    <label
      onClick={(e) => e.stopPropagation()}
      title="Color"
      style={{ ...BTN, width: '26px', borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.5)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
    >
      <input
        type="color"
        value={color}
        onChange={(e) => { e.stopPropagation(); onChange(itemId, field, e.target.value); }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer', padding: 0, border: 'none' }}
      />
    </label>
  );
}

function SizeStepper({ size, field, itemId, onChange }: { size: string; field: string; itemId: string; onChange: (id: string, field: string, s: string) => void }) {
  const cur = SIZE_STEPS.indexOf(size as typeof SIZE_STEPS[number]);
  const next = SIZE_STEPS[(cur + 1) % SIZE_STEPS.length];
  return (
    <button
      type="button"
      title={`Size: ${size} → click to change`}
      onClick={(e) => { e.stopPropagation(); onChange(itemId, field, next); }}
      style={{ ...BTN, width: '34px', background: 'rgba(255,255,255,0.15)', color: '#fff', letterSpacing: '0.03em' }}
    >
      {SIZE_LABELS[size]}
    </button>
  );
}

function TagToggle({ on, field, itemId, onChange }: { on: boolean; field: string; itemId: string; onChange: (id: string, field: string, v: boolean) => void }) {
  return (
    <button
      type="button"
      title={`Tag: ${on ? 'on' : 'off'}`}
      onClick={(e) => { e.stopPropagation(); onChange(itemId, field, !on); }}
      style={{ ...BTN, width: '34px', background: on ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)', color: on ? '#fff' : 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.2)' }}
    >
      {on ? '◉' : '○'}
    </button>
  );
}

function MainMock({ layout, selected, onSelect, hasBanner, items, itemColors = {}, itemSizes = {}, itemTags = {}, onItemColorChange, onItemSizeChange, onItemTagChange }: {
  layout: ILayoutMain; selected: boolean; onSelect: () => void; hasBanner: boolean; items: IMenuItem[];
  itemColors?: Record<string, IItemFieldColors>;
  itemSizes?:  Record<string, IItemFieldSizes>;
  itemTags?:   Record<string, IItemFieldTags>;
  onItemColorChange?: (id: string, field: string, color: string) => void;
  onItemSizeChange?:  (id: string, field: string, size: string) => void;
  onItemTagChange?:   (id: string, field: string, v: boolean) => void;
}) {
  const { columns, rows } = layout;
  const capacity = columns * rows;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{ flex: 1, minHeight: 0, padding: `1.5% 2% ${hasBanner ? '0.5%' : '1.5%'}`, display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: '1%', cursor: 'pointer', outline: selected ? '2px solid #60a5fa' : '2px solid transparent', outlineOffset: '-2px', transition: 'outline-color 0.15s', position: 'relative', overflow: 'hidden' }}
    >
      {Array.from({ length: capacity }, (_, i) => {
        const item = items[i] ?? null;
        const perColor: IItemFieldColors = (item && itemColors[item._id]) ? itemColors[item._id] : {};
        const perSize:  IItemFieldSizes  = (item && itemSizes[item._id])  ? itemSizes[item._id]  : {};
        const perTag:   IItemFieldTags   = (item && itemTags[item._id])   ? itemTags[item._id]   : {};
        const isHovered = hoveredIdx === i;

        const resolvedSizes = {
          category: MOCK_CAT_SIZES[perSize.category   ?? 'md'],
          name:     MOCK_NAME_SIZES[perSize.name       ?? 'lg'],
          price:    MOCK_PRICE_SIZES[perSize.price     ?? 'lg'],
        };

        const catColor   = perColor.category ?? '#ffffff';
        const nameColor  = perColor.name     ?? '#ffffff';
        const priceColor = perColor.price    ?? '#ffffff';
        const catTag   = perTag.category ?? true;
        const nameTag  = perTag.name     ?? false;
        const priceTag = perTag.price    ?? false;

        return (
          <MenuItemCard
            key={i}
            item={item}
            index={i}
            showCategory={layout.show_category_label}
            fieldColors={perColor}
            fieldSizes={perSize}
            fieldTags={perTag}
            resolvedSizes={resolvedSizes}
            isEditing={isHovered && item !== null}
            onMouseEnter={() => item && setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            categoryControls={isHovered && item && onItemColorChange ? (
              <>
                <ColorDot color={catColor} field="category" itemId={item._id} onChange={onItemColorChange} />
                {onItemSizeChange && <SizeStepper size={perSize.category ?? 'md'} field="category" itemId={item._id} onChange={onItemSizeChange} />}
                {onItemTagChange  && <TagToggle on={catTag} field="category" itemId={item._id} onChange={onItemTagChange} />}
              </>
            ) : undefined}
            nameControls={isHovered && item && onItemColorChange ? (
              <>
                <ColorDot color={nameColor} field="name" itemId={item._id} onChange={onItemColorChange} />
                {onItemSizeChange && <SizeStepper size={perSize.name ?? 'lg'} field="name" itemId={item._id} onChange={onItemSizeChange} />}
                {onItemTagChange  && <TagToggle on={nameTag} field="name" itemId={item._id} onChange={onItemTagChange} />}
              </>
            ) : undefined}
            priceControls={isHovered && item && onItemColorChange ? (
              <>
                <ColorDot color={priceColor} field="price" itemId={item._id} onChange={onItemColorChange} />
                {onItemSizeChange && <SizeStepper size={perSize.price ?? 'lg'} field="price" itemId={item._id} onChange={onItemSizeChange} />}
                {onItemTagChange  && <TagToggle on={priceTag} field="price" itemId={item._id} onChange={onItemTagChange} />}
              </>
            ) : undefined}
          />
        );
      })}
      {selected && <div style={{ position: 'absolute', top: '6px', left: '6px', background: '#3b82f6', color: '#fff', fontSize: '0.42em', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase', zIndex: 10 }}>Grid</div>}
    </div>
  );
}

function BannerMock({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{ flexShrink: 0, height: '8%', background: 'linear-gradient(90deg, #0f2460 0%, #1a3a8f 40%, #0f2460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: selected ? '2px solid #60a5fa' : '2px solid transparent', outlineOffset: '-2px', transition: 'outline-color 0.15s', position: 'relative' }}
    >
      <span style={{ fontSize: '0.62em', color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🔥 FLASH SALE — SPECIAL OFFERS TODAY</span>
      {selected && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#3b82f6', color: '#fff', fontSize: '0.42em', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>Banner</div>}
    </div>
  );
}

function SlideCanvas({ layout, selectedZone, onSelectZone, items, itemColors, itemSizes, itemTags, onItemColorChange, onItemSizeChange, onItemTagChange }: {
  layout: ILayoutConfig; selectedZone: Zone; onSelectZone: (z: Zone) => void; items: IMenuItem[];
  itemColors?: Record<string, IItemFieldColors>;
  itemSizes?:  Record<string, IItemFieldSizes>;
  itemTags?:   Record<string, IItemFieldTags>;
  onItemColorChange?: (id: string, field: string, color: string) => void;
  onItemSizeChange?:  (id: string, field: string, size: string) => void;
  onItemTagChange?:   (id: string, field: string, v: boolean) => void;
}) {
  const bg = BG_THEMES[layout.bg_theme ?? 'dark'].gradient;
  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ background: bg, display: 'flex', flexDirection: 'column', fontSize: '16px' }}
      onClick={() => onSelectZone(null)}
    >
      {layout.banner.visible && layout.banner.position === 'top' && <BannerMock selected={selectedZone === 'banner'} onSelect={() => onSelectZone('banner')} />}
      {layout.header.visible && <HeaderMock layout={layout.header} selected={selectedZone === 'header'} onSelect={() => onSelectZone('header')} />}
      <MainMock layout={layout.main} selected={selectedZone === 'main'} onSelect={() => onSelectZone('main')} hasBanner={layout.banner.visible} items={items} itemColors={itemColors} itemSizes={itemSizes} itemTags={itemTags} onItemColorChange={onItemColorChange} onItemSizeChange={onItemSizeChange} onItemTagChange={onItemTagChange} />
      {layout.banner.visible && layout.banner.position === 'bottom' && <BannerMock selected={selectedZone === 'banner'} onSelect={() => onSelectZone('banner')} />}
    </div>
  );
}

// ── Layout mini-diagram ───────────────────────────────────────────────────────

function LayoutDiagram({ layout }: { layout: ILayoutConfig }) {
  const { columns, rows } = layout.main;
  return (
    <div className="flex flex-col gap-0.5 w-16 pointer-events-none shrink-0">
      {layout.header.visible && <div className="h-1.5 rounded bg-blue-400/60 w-full" />}
      {layout.banner.visible && layout.banner.position === 'top' && <div className="h-1 rounded bg-amber-400/60 w-full" />}
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns * rows }).map((_, i) => <div key={i} className="h-4 rounded bg-slate-500/50" />)}
      </div>
      {layout.banner.visible && layout.banner.position === 'bottom' && <div className="h-1 rounded bg-amber-400/60 w-full" />}
    </div>
  );
}

// ── Properties panel ──────────────────────────────────────────────────────────

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-2 py-2.5 border-b border-gray-100 last:border-0"><span className="text-sm text-gray-600 shrink-0">{label}</span><div>{children}</div></div>;
}
function MiniToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!value)} className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>;
}
function PillButtons({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return <div className="flex gap-1 flex-wrap">{options.map(({ key, label }) => <button key={key} type="button" onClick={() => onChange(key)} className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-colors ${value === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>{label}</button>)}</div>;
}
function NumPills({ options, value, onChange }: { options: number[]; value: number; onChange: (v: number) => void }) {
  return <div className="flex gap-1">{options.map((n) => <button key={n} type="button" onClick={() => onChange(n)} className={`w-8 h-8 text-sm font-bold rounded-md border transition-colors ${value === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>{n}</button>)}</div>;
}

function PropertiesPanel({ layout, selectedZone, patchLayout }: {
  layout: ILayoutConfig; selectedZone: Zone; patchLayout: (updater: (l: ILayoutConfig) => ILayoutConfig) => void;
}) {
  const ph = (p: Partial<ILayoutHeader>) => patchLayout((l) => ({ ...l, header: { ...l.header, ...p } }));
  const pm = (p: Partial<ILayoutMain>) => patchLayout((l) => ({ ...l, main: { ...l.main, ...p } }));
  const pb = (p: Partial<ILayoutBanner>) => patchLayout((l) => ({ ...l, banner: { ...l.banner, ...p } }));

  if (!selectedZone) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Background Theme</div>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.entries(BG_THEMES).map(([key, { label, gradient }]) => {
            const active = (layout.bg_theme ?? 'dark') === key;
            return <button key={key} type="button" title={label} onClick={() => patchLayout((l) => ({ ...l, bg_theme: key as ILayoutConfig['bg_theme'] }))} className={`aspect-square rounded-lg border-2 transition-all ${active ? 'border-blue-500 scale-110' : 'border-gray-200 hover:border-gray-400'}`} style={{ background: gradient }} />;
          })}
        </div>
        <div className="text-xs text-gray-400 text-center capitalize">{BG_THEMES[layout.bg_theme ?? 'dark'].label}</div>
        <div className="pt-3 border-t text-xs text-gray-400 text-center leading-relaxed">Click a zone on the canvas<br />to edit its properties</div>
      </div>
    );
  }
  if (selectedZone === 'header') {
    const h = layout.header;
    return (
      <div className="p-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Header</div>
        <div className="divide-y divide-gray-100">
          <PropRow label="Visible"><MiniToggle value={h.visible} onChange={(v) => ph({ visible: v })} /></PropRow>
          <PropRow label="Store name"><MiniToggle value={h.show_name} onChange={(v) => ph({ show_name: v })} /></PropRow>
          <PropRow label="Logo"><MiniToggle value={h.show_logo} onChange={(v) => ph({ show_logo: v })} /></PropRow>
          <PropRow label="Clock"><MiniToggle value={h.show_clock} onChange={(v) => ph({ show_clock: v })} /></PropRow>
          <div className="py-3"><div className="text-sm text-gray-600 mb-2">Name size</div><PillButtons options={[{ key: 'sm', label: 'S' }, { key: 'md', label: 'M' }, { key: 'lg', label: 'L' }, { key: 'xl', label: 'XL' }]} value={h.name_size ?? 'md'} onChange={(v) => ph({ name_size: v as ILayoutHeader['name_size'] })} /></div>
        </div>
      </div>
    );
  }
  if (selectedZone === 'main') {
    const m = layout.main;
    return (
      <div className="p-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Grid</div>
        <div className="space-y-4">
          <div><div className="text-sm text-gray-600 mb-2">Columns</div><NumPills options={[1, 2, 3, 4]} value={m.columns} onChange={(v) => pm({ columns: v })} /></div>
          <div><div className="text-sm text-gray-600 mb-2">Rows</div><NumPills options={[1, 2, 3]} value={m.rows} onChange={(v) => pm({ rows: v })} /></div>
          <div className="flex items-center justify-between border-t pt-3"><span className="text-sm text-gray-600">Category label</span><MiniToggle value={m.show_category_label} onChange={(v) => pm({ show_category_label: v })} /></div>
          <div className="border-t pt-3 text-xs text-gray-400 leading-relaxed">Hover over items on the canvas to set per-item colors, sizes &amp; tag style (◉)</div>
        </div>
      </div>
    );
  }
  if (selectedZone === 'banner') {
    const b = layout.banner;
    return (
      <div className="p-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Flash Sale Banner</div>
        <div className="divide-y divide-gray-100">
          <PropRow label="Visible"><MiniToggle value={b.visible} onChange={(v) => pb({ visible: v })} /></PropRow>
          <div className="py-3"><div className="text-sm text-gray-600 mb-2">Position</div><PillButtons options={[{ key: 'top', label: '↑ Top' }, { key: 'bottom', label: '↓ Bottom' }]} value={b.position} onChange={(v) => pb({ position: v as 'top' | 'bottom' })} /></div>
        </div>
      </div>
    );
  }
  return null;
}

// ── Slide Editor (full-screen overlay) ───────────────────────────────────────

function SlideEditor({ slide, allItems, categories, onSave, onClose, isSaving }: {
  slide: IPlaylistSlide | null;
  allItems: IMenuItem[];
  categories: ICategory[];
  onSave: (s: IPlaylistSlide) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [label, setLabel] = useState(slide?.label ?? '');
  const [duration, setDuration] = useState(slide?.duration_sec ?? 9);
  const [selectedIds, setSelectedIds] = useState<string[]>(slide?.item_ids ?? []);
  const [layout, setLayout] = useState<ILayoutConfig>(slide?.layout ?? DEFAULT_LAYOUT);
  const [itemColors, setItemColors] = useState<Record<string, IItemFieldColors>>(slide?.item_colors ?? {});
  const [itemSizes,  setItemSizes]  = useState<Record<string, IItemFieldSizes>>(slide?.item_sizes  ?? {});
  const [itemTags,   setItemTags]   = useState<Record<string, IItemFieldTags>>(slide?.item_tags    ?? {});
  const [selectedZone, setSelectedZone] = useState<Zone>('main');
  const [catFilter, setCatFilter] = useState('all');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const patchLayout = useCallback((updater: (l: ILayoutConfig) => ILayoutConfig) => {
    setLayout((prev) => updater(prev));
  }, []);

  const activeItems = allItems.filter((i) => i.is_active);
  const filtered = catFilter === 'all' ? activeItems : activeItems.filter((i) => i.category._id === catFilter);

  const canvasItems = useMemo(() => {
    // For new slides (no label yet), show placeholder grid (1 2 3 4...)
    if (!slide && selectedIds.length === 0) {
      return [];
    }
    if (selectedIds.length > 0) {
      return selectedIds.map((id) => allItems.find((i) => i._id === id)).filter((i): i is IMenuItem => !!i);
    }
    return activeItems;
  }, [slide, selectedIds, allItems, activeItems]);

  function toggle(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function submit() {
    onSave({ _id: slide?._id, label, item_ids: selectedIds, duration_sec: duration, layout, item_colors: itemColors, item_sizes: itemSizes, item_tags: itemTags });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b border-white/10 bg-gray-900">
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors shrink-0">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Slide label (e.g. Burgers, Happy Hour…)"
            className="bg-transparent text-white font-semibold text-sm border-b border-transparent hover:border-gray-500 focus:border-blue-400 focus:outline-none transition-colors w-56 placeholder:text-gray-600"
          />
          <span className="text-gray-600 text-xs shrink-0">Duration:</span>
          <input
            type="number" min={3} max={300} value={duration}
            onChange={(e) => setDuration(Math.max(3, Number(e.target.value)))}
            className="bg-gray-800 text-white text-sm rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
          />
          <span className="text-gray-600 text-xs shrink-0">sec</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setOrientation('landscape')}
            title="Landscape (16:9)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${orientation === 'landscape' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none"><rect x="0.5" y="0.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
            Landscape
          </button>
          <button
            type="button"
            onClick={() => setOrientation('portrait')}
            title="Portrait (9:16)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${orientation === 'portrait' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <svg className="w-3 h-4" viewBox="0 0 12 16" fill="none"><rect x="0.5" y="0.5" width="11" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
            Portrait
          </button>
        </div>
        <button onClick={submit} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
          <CheckIcon className="w-4 h-4" />
          {isSaving ? 'Saving…' : slide?._id ? 'Update Slide' : 'Add Slide'}
        </button>
      </div>

      {/* Body: items | canvas | properties */}
      <div className="flex flex-1 min-h-0">
        {/* Left: items panel */}
        <div className="shrink-0 w-60 border-r border-white/10 bg-gray-900 flex flex-col overflow-hidden">
          <div className="px-3 pt-3 pb-2 border-b border-white/10">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items</div>
            <div className="text-xs text-gray-500 mb-2">
              {selectedIds.length === 0 ? 'All items shown on display' : `${selectedIds.length} selected`}
            </div>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setCatFilter('all')} className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${catFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>All</button>
              {categories.map((c) => (
                <button key={c._id} onClick={() => setCatFilter(c._id)} className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${catFilter === c._id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{c.name}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {filtered.map((item) => {
              const checked = selectedIds.includes(item._id);
              return (
                <label key={item._id} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-blue-900/40 border border-blue-700/50' : 'hover:bg-gray-800'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(item._id)} className="w-3.5 h-3.5 accent-blue-600 shrink-0" />
                  {item.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.image_url} alt={item.name} className="w-7 h-7 rounded object-cover shrink-0" />
                    : <div className="w-7 h-7 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">{item.name[0]}</div>
                  }
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category.name} · ${item.price.toFixed(2)}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Center: live canvas */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <div
            className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            style={orientation === 'landscape'
              ? { aspectRatio: '16/9', width: '100%', maxWidth: 'calc((100vh - 120px) * 16 / 9)', maxHeight: 'calc(100vh - 120px)' }
              : { aspectRatio: '9/16', height: '100%', maxHeight: 'calc(100vh - 120px)', maxWidth: 'calc((100vh - 120px) * 9 / 16)' }
            }
          >
            <SlideCanvas
              layout={layout}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              items={canvasItems}
              itemColors={itemColors}
              itemSizes={itemSizes}
              itemTags={itemTags}
              onItemColorChange={(id, field, color) => setItemColors((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: color } }))}
              onItemSizeChange={(id, field, size) => setItemSizes((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: size } }))}
              onItemTagChange={(id, field, v) => setItemTags((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: v } }))}
            />
          </div>
        </div>

        {/* Right: properties */}
        <div className="shrink-0 w-60 border-l border-white/10 bg-white overflow-y-auto">
          <PropertiesPanel layout={layout} selectedZone={selectedZone} patchLayout={patchLayout} />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlaylistEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: playlist, isLoading: playlistLoading } = useQuery<IPlaylist>({
    queryKey: ['playlist', id],
    queryFn: () => playlistApi.getOne(id).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: allItems = [] } = useQuery<IMenuItem[]>({
    queryKey: ['menu-items-display'],
    queryFn: () => menuApi.getItems().then((r) => r.data.data ?? r.data),
  });

  const { data: categories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data.data),
  });

  const [slides, setSlides] = useState<IPlaylistSlide[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [nameIsDirty, setNameIsDirty] = useState(false);
  const initRef = useRef(false);
  const slidesRef = useRef<IPlaylistSlide[]>([]);

  useEffect(() => {
    if (playlist && !initRef.current) {
      initRef.current = true;
      setPlaylistName(playlist.name);
      const mapped = playlist.slides.map((s) => ({
        _id: s._id,
        label: s.label ?? '',
        item_ids: s.item_ids ?? [],
        duration_sec: s.duration_sec ?? 9,
        layout: (s.layout as ILayoutConfig) ?? DEFAULT_LAYOUT,
        item_colors: s.item_colors ?? {},
        item_sizes:  s.item_sizes  ?? {},
        item_tags:   s.item_tags   ?? {},
      }));
      setSlides(mapped);
      slidesRef.current = mapped;
    }
  }, [playlist]);

  const saveMutation = useMutation({
    mutationFn: (nextSlides: IPlaylistSlide[]) =>
      playlistApi.update(id, { name: playlistName, slides: nextSlides }),
    onSuccess: (_, nextSlides) => {
      queryClient.invalidateQueries({ queryKey: ['playlist', id] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      slidesRef.current = nextSlides;
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to save');
    },
  });

  const nameSaveMutation = useMutation({
    mutationFn: (name: string) =>
      playlistApi.update(id, { name, slides: slidesRef.current }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setNameIsDirty(false);
      toast.success('Name saved');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to save name');
    },
  });

  const [editingSlide, setEditingSlide] = useState<{ slide: IPlaylistSlide | null; index: number | null } | null>(null);

  function openNew() { setEditingSlide({ slide: null, index: null }); }
  function openEdit(idx: number) { setEditingSlide({ slide: slides[idx], index: idx }); }
  function closeEditor() { setEditingSlide(null); }

  function handleSaveSlide(saved: IPlaylistSlide) {
    const next = (() => {
      if (editingSlide?.index !== null && editingSlide?.index !== undefined) {
        const arr = [...slides]; arr[editingSlide.index] = saved; return arr;
      }
      return [...slides, saved];
    })();
    setSlides(next);
    saveMutation.mutate(next, {
      onSuccess: () => { toast.success(saved._id ? 'Slide updated' : 'Slide added'); closeEditor(); },
    });
  }

  function removeSlide(idx: number) {
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    saveMutation.mutate(next, {
      onSuccess: () => toast.success('Slide removed'),
    });
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    const next = [...slides]; const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSlides(next);
    saveMutation.mutate(next);
  }

  // Show full-screen slide editor overlay
  if (editingSlide !== null) {
    return (
      <SlideEditor
        slide={editingSlide.slide}
        allItems={allItems}
        categories={categories}
        onSave={handleSaveSlide}
        onClose={closeEditor}
        isSaving={saveMutation.isPending}
      />
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/dashboard/display')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Playlists
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              value={playlistName}
              onChange={(e) => { setPlaylistName(e.target.value); setNameIsDirty(true); }}
              onBlur={() => { if (nameIsDirty) nameSaveMutation.mutate(playlistName); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
              placeholder="Playlist name"
              className="text-2xl font-bold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none transition-colors flex-1"
            />
            {nameSaveMutation.isPending && <span className="text-xs text-gray-400">Saving…</span>}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {slides.length} slide{slides.length !== 1 ? 's' : ''} · Each slide has its own layout and items
          </p>
        </div>
      </div>

      {/* Slides list */}
      {playlistLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {slides.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-center">
              <TvIcon className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No slides yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your first slide to start building this playlist</p>
            </div>
          )}

          {slides.map((slide, idx) => (
            <div key={slide._id ?? idx} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors">
              <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-sm font-black flex items-center justify-center shrink-0">{idx + 1}</span>
              <div className="bg-slate-800 rounded-lg p-2 shrink-0">
                <LayoutDiagram layout={slide.layout} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{slide.label || `Slide ${idx + 1}`}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {slide.layout.main.columns}×{slide.layout.main.rows} grid
                  {' · '}
                  {slide.item_ids.length > 0 ? `${slide.item_ids.length} items` : 'All items'}
                  {' · '}
                  {slide.duration_sec}s
                  {' · '}
                  <span className="capitalize">{slide.layout.bg_theme ?? 'dark'}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moveSlide(idx, -1)} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded-lg transition-colors"><ChevronUpIcon className="w-4 h-4" /></button>
                <button onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1} className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded-lg transition-colors"><ChevronDownIcon className="w-4 h-4" /></button>
                <button onClick={() => openEdit(idx)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => removeSlide(idx)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
          ))}

          <button onClick={openNew} className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all">
            <PlusIcon className="w-5 h-5" />
            Add Slide
          </button>
        </div>
      )}


    </div>
  );
}
