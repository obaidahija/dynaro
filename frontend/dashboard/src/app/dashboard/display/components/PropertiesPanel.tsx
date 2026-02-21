'use client';

import React from 'react';
import type { ILayoutConfig, ILayoutHeader, ILayoutMain, ILayoutBanner, IItemFieldColors, IItemFieldSizes, IItemFieldTags } from '@shared/display-types';
import { BG_THEMES } from '@shared/display-types';

type Zone = 'header' | 'main' | 'banner' | null;

// ── UI Components ──────────────────────────────────────────────────────────

export function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-2 py-2.5 border-b border-gray-100 last:border-0"><span className="text-sm text-gray-600 shrink-0">{label}</span><div>{children}</div></div>;
}

export function MiniToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!value)} className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} /></button>;
}

export function PillButtons({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return <div className="flex gap-1 flex-wrap">{options.map(({ key, label }) => <button key={key} type="button" onClick={() => onChange(key)} className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-colors ${value === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>{label}</button>)}</div>;
}

export function NumPills({ options, value, onChange }: { options: number[]; value: number; onChange: (v: number) => void }) {
  return <div className="flex gap-1">{options.map((n) => <button key={n} type="button" onClick={() => onChange(n)} className={`w-8 h-8 text-sm font-bold rounded-md border transition-colors ${value === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>{n}</button>)}</div>;
}

// ── PropertiesPanel Component ──────────────────────────────────────────────

export interface PropertiesPanelProps {
  layout: ILayoutConfig;
  selectedZone: Zone;
  patchLayout: (updater: (l: ILayoutConfig) => ILayoutConfig) => void;
  selectedField?: { itemId: string; fieldType: 'category' | 'name' | 'price' } | null;
  itemColors?: Record<string, IItemFieldColors>;
  itemSizes?: Record<string, IItemFieldSizes>;
  itemTags?: Record<string, IItemFieldTags>;
  onChangeFieldColor?: (field: 'category' | 'name' | 'price', color: string) => void;
  onChangeFieldSize?: (field: 'category' | 'name' | 'price', size: string) => void;
  onChangeFieldTag?: (field: 'category' | 'name' | 'price', tag: boolean) => void;
}

export function PropertiesPanel({
  layout,
  selectedZone,
  patchLayout,
  selectedField,
  itemColors = {},
  itemSizes = {},
  itemTags = {},
  onChangeFieldColor,
  onChangeFieldSize,
  onChangeFieldTag,
}: PropertiesPanelProps) {
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
    const currentFieldType = selectedField?.fieldType;
    const currentFieldColor = selectedField ? (itemColors[selectedField.itemId]?.[selectedField.fieldType] ?? '#ffffff') : '#ffffff';
    const currentFieldSize = selectedField ? (itemSizes[selectedField.itemId]?.[selectedField.fieldType] ?? (selectedField.fieldType === 'category' ? 'md' : 'lg')) : 'md';
    const currentFieldTag = selectedField ? (itemTags[selectedField.itemId]?.[selectedField.fieldType] ?? (selectedField.fieldType === 'category')) : true;

    return (
      <div className="p-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Grid</div>
        <div className="space-y-4">
          <div><div className="text-sm text-gray-600 mb-2">Columns</div><NumPills options={[1, 2, 3, 4]} value={m.columns} onChange={(v) => pm({ columns: v })} /></div>
          <div><div className="text-sm text-gray-600 mb-2">Rows</div><NumPills options={[1, 2, 3]} value={m.rows} onChange={(v) => pm({ rows: v })} /></div>
          <div className="flex items-center justify-between border-t pt-3"><span className="text-sm text-gray-600">Category label</span><MiniToggle value={m.show_category_label} onChange={(v) => pm({ show_category_label: v })} /></div>

          {/* Unified field controls - shown when a field is selected on canvas */}
          {selectedField && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-3 font-semibold">
                {currentFieldType === 'category' ? 'Category' : currentFieldType === 'name' ? 'Name' : 'Price'} Styling
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                <div>
                  <label className="text-xs text-gray-600 mb-2 block font-semibold">Color</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="color"
                      value={currentFieldColor}
                      onChange={(e) => onChangeFieldColor?.(currentFieldType as 'category' | 'name' | 'price', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{currentFieldColor}</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-2 block font-semibold">Size</label>
                  <PillButtons
                    options={[
                      { key: 'sm', label: 'S' },
                      { key: 'md', label: 'M' },
                      { key: 'lg', label: 'L' },
                      { key: 'xl', label: 'XL' }
                    ]}
                    value={currentFieldSize}
                    onChange={(v) => onChangeFieldSize?.(currentFieldType as 'category' | 'name' | 'price', v)}
                  />
                </div>

                <div className="flex items-center justify-between bg-white rounded border border-gray-200 p-2">
                  <span className="text-xs text-gray-600 font-semibold">Show tag (◉)</span>
                  <MiniToggle value={currentFieldTag} onChange={(v) => onChangeFieldTag?.(currentFieldType as 'category' | 'name' | 'price', v)} />
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-3 text-xs text-gray-400 leading-relaxed">Click on category, name, or price text on items to edit styling for all items</div>
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
