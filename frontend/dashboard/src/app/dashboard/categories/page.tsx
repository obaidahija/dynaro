'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { storeTypeApi, superadminCategoryApi } from '@/lib/api';
import {
  TagIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';

// ── Types ──────────────────────────────────────────────────────────────────────
interface IStoreType { id: string; name: string; }
interface ICategory { _id: string; name: string; store_type: string; is_disabled: boolean; sort_order: number; }

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // ── Fetch store types ──────────────────────────────────────────────────────
  const { data: storeTypes = [], isLoading: typesLoading } = useQuery<IStoreType[]>({
    queryKey: ['store-types'],
    queryFn: () => storeTypeApi.getAll().then((r) => r.data.data),
  });

  // ── Fetch categories for selected type ────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading } = useQuery<ICategory[]>({
    queryKey: ['admin-categories', selectedType],
    queryFn: () => superadminCategoryApi.getAll(selectedType).then((r) => r.data.data),
    enabled: !!selectedType,
  });

  // ── Add mutation ──────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (name: string) => superadminCategoryApi.add(name, selectedType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories', selectedType] });
      setNewName('');
      toast.success('Category added');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to add category');
    },
  });

  // ── Rename mutation ───────────────────────────────────────────────────────
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      superadminCategoryApi.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories', selectedType] });
      setEditingId(null);
      toast.success('Category renamed');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to rename category');
    },
  });

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => superadminCategoryApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories', selectedType] });
      toast.success('Category deleted');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    },
  });

  // ── Toggle disabled mutation ──────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_disabled }: { id: string; is_disabled: boolean }) =>
      superadminCategoryApi.toggle(id, is_disabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories', selectedType] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to update category');
    },
  });

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addMutation.mutate(name);
  };

  const handleStartEdit = (cat: ICategory) => {
    setEditingId(cat._id);
    setEditName(cat.name);
  };

  const handleSaveEdit = () => {
    const name = editName.trim();
    if (!name || !editingId) return;
    renameMutation.mutate({ id: editingId, name });
  };

  const selectedTypeLabel = storeTypes.find((t) => t.id === selectedType)?.name ?? '';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 mt-1">Manage global categories per store type</p>
      </div>

      {/* Store type selector */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Store Type</p>
        {typesLoading ? (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {storeTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedType(t.id); setEditingId(null); setNewName(''); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selectedType === t.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Categories panel */}
      {!selectedType ? (
        <div className="bg-white rounded-xl shadow-sm flex flex-col items-center justify-center py-24 text-center">
          <TagIcon className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Choose a store type above</p>
          <p className="text-sm text-gray-400 mt-1">Categories will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm">
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{selectedTypeLabel}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {catsLoading ? '…' : `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`}
              </p>
            </div>
          </div>

          {/* Category list */}
          <div className="divide-y divide-gray-100">
            {catsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-3">
                  <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
              ))
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-400 text-sm">No categories yet for this store type</p>
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat._id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors group">
                  {editingId === cat._id ? (
                    <>
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                        className="flex-1 px-3 py-1.5 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={renameMutation.isPending}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 text-sm ${cat.is_disabled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {cat.name}
                      </span>
                      {cat.is_disabled && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">disabled</span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Rename"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate({ id: cat._id, is_disabled: !cat.is_disabled })}
                          disabled={toggleMutation.isPending}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            cat.is_disabled
                              ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                          }`}
                          title={cat.is_disabled ? 'Enable category' : 'Disable category'}
                        >
                          <NoSymbolIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(cat._id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add new row */}
          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex items-center gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={`New category for ${selectedTypeLabel}…`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || addMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
