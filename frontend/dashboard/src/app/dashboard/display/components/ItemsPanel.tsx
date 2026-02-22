'use client';

import React from 'react';
import { transformCloudinaryUrl } from '@/lib/cloudinary';

interface IMenuItem {
  _id: string;
  name: string;
  image_url?: string;
  price: number;
  is_active: boolean;
  category: { _id: string; name: string };
}

interface ICategory {
  _id: string;
  name: string;
  sort_order: number;
}

export interface ItemsPanelProps {
  categories: ICategory[];
  filtered: IMenuItem[];
  selectedIds: string[];
  catFilter: string;
  onToggleItem: (id: string) => void;
  onChangeCategoryFilter: (catId: string) => void;
}

export function ItemsPanel({
  categories,
  filtered,
  selectedIds,
  catFilter,
  onToggleItem,
  onChangeCategoryFilter,
}: ItemsPanelProps) {
  return (
    <div className="shrink-0 w-60 border-r border-white/10 bg-gray-900 flex flex-col overflow-hidden">
      {/* Header: category filters */}
      <div className="px-3 pt-3 pb-2 border-b border-white/10">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items</div>
        <div className="text-xs text-gray-500 mb-2">
          {selectedIds.length === 0 ? 'All items shown on display' : `${selectedIds.length} selected`}
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onChangeCategoryFilter('all')}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              catFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => onChangeCategoryFilter(c._id)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                catFilter === c._id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable items list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {filtered.map((item) => {
          const isSelected = selectedIds.includes(item._id);
          return (
            <button
              key={item._id}
              onClick={() => onToggleItem(item._id)}
              className={`w-full relative flex flex-col items-center gap-2 p-2 rounded-lg transition-all border-2 ${
                isSelected
                  ? 'bg-blue-900/60 border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-gray-800/50 border-transparent hover:bg-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Large image - prominent focus */}
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={transformCloudinaryUrl(item.image_url)}
                  alt={item.name}
                  className="w-full h-32 rounded object-cover"
                />
              ) : (
                <div className="w-full h-32 rounded bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-400">
                  {item.name[0]}
                </div>
              )}
              
              {/* Item info below image */}
              <div className="w-full text-center">
                <p className="text-sm font-semibold text-gray-100 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">
                  {item.category.name} · ${item.price.toFixed(2)}
                </p>
              </div>

              {/* Selection checkmark */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
