'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, TvIcon } from '@heroicons/react/24/outline';
import type { ILayoutConfig, IItemFieldColors, IItemFieldSizes, IItemFieldTags } from '@shared/display-types';

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

interface SlidesListProps {
  slides: IPlaylistSlide[];
  isLoading: boolean;
  onAddSlide: () => void;
  onEditSlide: (index: number) => void;
  onRemoveSlide: (index: number) => void;
  onReorderSlides: (newSlides: IPlaylistSlide[]) => void;
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

// ── SlidesList Component ───────────────────────────────────────────────────────

export function SlidesList({
  slides,
  isLoading,
  onAddSlide,
  onEditSlide,
  onRemoveSlide,
  onReorderSlides,
}: SlidesListProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIdx === null || dragIdx === idx) return;
    setOverIdx(idx);
  };

  const handleDrop = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newSlides = [...slides];
    const [moved] = newSlides.splice(dragIdx, 1);
    newSlides.splice(idx, 0, moved);
    onReorderSlides(newSlides);
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slides.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl text-center">
          <TvIcon className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No slides yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first slide to start building this playlist</p>
        </div>
      )}

      {slides.map((slide, idx) => (
        <div
          key={slide._id ?? idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(idx, e)}
          onDragLeave={() => setOverIdx(null)}
          onDrop={(e) => handleDrop(idx, e)}
          onDragEnd={handleDragEnd}
          className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing"
          style={{
            opacity: dragIdx === idx ? 0.35 : 1,
            outline: overIdx === idx && dragIdx !== idx ? '2px solid #60a5fa' : '2px solid transparent',
            borderColor: overIdx === idx && dragIdx !== idx ? '#60a5fa' : undefined,
          }}
        >
          <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-sm font-black flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            ⋮
          </span>
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
            <button
              onClick={() => onEditSlide(idx)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemoveSlide(idx)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={onAddSlide}
        className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
      >
        <PlusIcon className="w-5 h-5" />
        Add Slide
      </button>
    </div>
  );
}
