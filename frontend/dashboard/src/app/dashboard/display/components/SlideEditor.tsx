'use client';

import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  CheckIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  ILayoutConfig, IItemFieldColors, IItemFieldSizes, IItemFieldTags, IItemFieldImage,
} from '@shared/display-types';
import { PropertiesPanel } from './PropertiesPanel';
import { ItemsPanel } from './ItemsPanel';
import { SlideCanvas } from './SlideCanvas';

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
  item_images?: Record<string, IItemFieldImage>;
}

type Zone = 'header' | 'main' | 'banner' | null;

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_LAYOUT: ILayoutConfig = {
  header: { visible: true, show_logo: true, show_name: true, show_clock: true },
  main: { type: 'menu-grid', columns: 3, rows: 2, show_category_label: true },
  banner: { visible: true, position: 'bottom' },
  bg_theme: 'dark',
};

// ── SlideEditor Component ──────────────────────────────────────────────────────

interface SlideEditorProps {
  slide: IPlaylistSlide | null;
  allItems: IMenuItem[];
  categories: ICategory[];
  onSave: (s: IPlaylistSlide) => void;
  onClose: () => void;
  isSaving: boolean;
}

export function SlideEditor({ slide, allItems, categories, onSave, onClose, isSaving }: SlideEditorProps) {
  const [label, setLabel] = useState(slide?.label ?? '');
  const [duration, setDuration] = useState(slide?.duration_sec ?? 9);
  const [selectedIds, setSelectedIds] = useState<string[]>(slide?.item_ids ?? []);
  const [layout, setLayout] = useState<ILayoutConfig>(slide?.layout ?? DEFAULT_LAYOUT);
  const [itemColors, setItemColors] = useState<Record<string, IItemFieldColors>>(slide?.item_colors ?? {});
  const [itemSizes,  setItemSizes]  = useState<Record<string, IItemFieldSizes>>(slide?.item_sizes  ?? {});
  const [itemTags,   setItemTags]   = useState<Record<string, IItemFieldTags>>(slide?.item_tags    ?? {});
  const [itemImages, setItemImages] = useState<Record<string, IItemFieldImage>>(slide?.item_images ?? {});
  const [selectedZone, setSelectedZone] = useState<Zone>('main');
  const [selectedField, setSelectedField] = useState<{ itemId: string; fieldType: 'category' | 'name' | 'price' | 'image' } | null>(null);
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

  // Handle field color changes - apply only to the selected item
  const handleFieldColorChange = useCallback((field: 'category' | 'name' | 'price', color: string) => {
    if (!selectedField) return;
    setItemColors((prev) => ({
      ...prev,
      [selectedField.itemId]: {
        ...(prev[selectedField.itemId] ?? {}),
        [field]: color
      }
    }));
  }, [selectedField]);

  // Handle field size changes - apply only to the selected item
  const handleFieldSizeChange = useCallback((field: 'category' | 'name' | 'price', size: string) => {
    if (!selectedField) return;
    setItemSizes((prev) => ({
      ...prev,
      [selectedField.itemId]: {
        ...(prev[selectedField.itemId] ?? {}),
        [field]: size
      }
    }));
  }, [selectedField]);

  // Handle field tag changes - apply only to the selected item
  const handleFieldTagChange = useCallback((field: 'category' | 'name' | 'price', tag: boolean) => {
    if (!selectedField) return;
    setItemTags((prev) => ({
      ...prev,
      [selectedField.itemId]: {
        ...(prev[selectedField.itemId] ?? {}),
        [field]: tag
      }
    }));
  }, [selectedField]);

  // Handle image position change - apply to the selected item
  const handleImagePositionChange = useCallback((position: string) => {
    if (!selectedField) return;
    setItemImages((prev) => ({
      ...prev,
      [selectedField.itemId]: {
        ...(prev[selectedField.itemId] ?? {}),
        position,
      },
    }));
  }, [selectedField]);

  // Handle image scale (zoom) change - apply to the selected item
  const handleImageScaleChange = useCallback((scale: number) => {
    if (!selectedField) return;
    setItemImages((prev) => ({
      ...prev,
      [selectedField.itemId]: {
        ...(prev[selectedField.itemId] ?? {}),
        scale,
      },
    }));
  }, [selectedField]);

  function toggle(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function submit() {
    onSave({ _id: slide?._id, label, item_ids: selectedIds, duration_sec: duration, layout, item_colors: itemColors, item_sizes: itemSizes, item_tags: itemTags, item_images: itemImages });
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
        <ItemsPanel
          categories={categories}
          filtered={filtered}
          selectedIds={selectedIds}
          catFilter={catFilter}
          onToggleItem={toggle}
          onChangeCategoryFilter={setCatFilter}
        />

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
              itemImages={itemImages}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              onRemoveItem={(itemId) => setSelectedIds((prev) => prev.filter((x) => x !== itemId))}
              onReorderItems={(newItems) => setSelectedIds(newItems.map((i) => i._id))}
            />
          </div>
        </div>

        {/* Right: properties */}
        <div className="shrink-0 w-60 border-l border-white/10 bg-white overflow-y-auto">
          <PropertiesPanel
            layout={layout}
            selectedZone={selectedZone}
            patchLayout={patchLayout}
            selectedField={selectedField}
            itemColors={itemColors}
            itemSizes={itemSizes}
            itemTags={itemTags}
            itemImages={itemImages}
            onChangeFieldColor={handleFieldColorChange}
            onChangeFieldSize={handleFieldSizeChange}
            onChangeFieldTag={handleFieldTagChange}
            onChangeImagePosition={handleImagePositionChange}
            onChangeImageScale={handleImageScaleChange}
          />
        </div>
      </div>
    </div>
  );
}
