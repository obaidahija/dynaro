'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { transformCloudinaryUrl } from '@/lib/cloudinary';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { menuApi, categoryApi } from '@/lib/api';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ShoppingBagIcon,
  EyeIcon,
  EyeSlashIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: { _id: string; name: string };
  tags: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}
interface ICategory {
  _id: string;
  name: string;
  store_type: string;
  is_disabled: boolean;
  sort_order: number;
}
// ── Zod schema ────────────────────────────────────────────────────────────────
const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  image_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  category: z.string().min(1, 'Category is required'),
  is_active: z.boolean().default(true),
});
type ItemForm = z.infer<typeof itemSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(price: number) {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const ACCENT_PALETTE = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#EC4899',
];
function accent(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return ACCENT_PALETTE[h % ACCENT_PALETTE.length];
}

// ── Item Form Modal ───────────────────────────────────────────────────────────
function ItemModal({
  initial,
  categories,
  onClose,
}: {
  initial?: MenuItem;
  categories: ICategory[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          price: initial.price,
          image_url: initial.image_url ?? '',
          category: initial.category._id,
          is_active: initial.is_active,
        }
      : { is_active: true },
  });

  const mutation = useMutation({
    mutationFn: (data: ItemForm) =>
      isEdit
        ? menuApi.updateItem(initial!._id, data as Record<string, unknown>)
        : menuApi.createItem(data as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success(isEdit ? 'Item updated' : 'Item created');
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Something went wrong');
    },
  });

  const previewImage = watch('image_url');

  // Include item's current category even if it's not in the managed list (legacy support)
  const catOptions = [
    ...(initial?.category && !categories.find((c) => c._id === initial.category._id)
      ? [{ _id: initial.category._id, name: initial.category.name, store_type: '', is_disabled: false, sort_order: 0 }]
      : []),
    ...categories,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Item' : 'Add Menu Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {previewImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transformCloudinaryUrl(previewImage)}
                alt="preview"
                className="w-full h-40 object-cover rounded-xl border border-gray-200"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Espresso"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select category…</option>
                  {catOptions.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('price')}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4.50"
                />
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Short description shown on the display screen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                {...register('image_url')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://…"
              />
              {errors.image_url && <p className="mt-1 text-xs text-red-500">{errors.image_url.message}</p>}
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input {...register('is_active')} type="checkbox" className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Active (available in menu)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-5 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Manage Categories Modal ───────────────────────────────────────────────────
// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({
  item,
  onCancel,
  onConfirm,
  loading,
}: {
  item: MenuItem;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <TrashIcon className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Delete Item</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Remove <strong>{item.name}</strong> from the menu? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sortable Card ─────────────────────────────────────────────────────────────
function SortableCard({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const color = accent(item.category.name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col will-change-transform ${
        item.is_active ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'
      }`}
    >
      <div className="relative">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={transformCloudinaryUrl(item.image_url)} alt={item.name} className="w-full h-32 object-cover" />
        ) : (
          <div
            className="w-full h-32 flex items-center justify-center text-5xl font-black"
            style={{ background: `${color}18`, color }}
          >
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1 bg-black/30 hover:bg-black/50 text-white rounded-md cursor-grab active:cursor-grabbing transition-colors touch-none"
          title="Drag to reorder"
        >
          <Bars3Icon className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="font-semibold text-gray-900 leading-snug">{item.name}</h3>
          <span
            className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {item.category.name}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.description}</p>
        )}
        <p className="text-lg font-bold text-gray-900 mt-auto">{fmt(item.price)}</p>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              item.is_active ? 'text-green-600 hover:text-gray-500' : 'text-gray-400 hover:text-green-600'
            }`}
            title={item.is_active ? 'Mark inactive' : 'Mark active'}
          >
            {item.is_active
              ? <><EyeIcon className="w-4 h-4" /> Active</>
              : <><EyeSlashIcon className="w-4 h-4" /> Inactive</>}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drag overlay ghost ────────────────────────────────────────────────────────
function OverlayCard({ item }: { item: MenuItem }) {
  const color = accent(item.category.name);
  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{
        boxShadow: '0 25px 50px -5px rgba(0,0,0,0.25), 0 10px 20px -5px rgba(0,0,0,0.15)',
        transform: 'rotate(2deg) scale(1.04)',
        outline: '2px solid #818cf8',
        cursor: 'grabbing',
      }}
    >
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={transformCloudinaryUrl(item.image_url)} alt={item.name} className="w-full h-32 object-cover" />
      ) : (
        <div
          className="w-full h-32 flex items-center justify-center text-5xl font-black"
          style={{ background: `${color}18`, color }}
        >
          {item.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="p-4">
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="text-lg font-bold text-gray-900 mt-1">{fmt(item.price)}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'add' | MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [activeCat, setActiveCat] = useState('All');
  const [activeStatus, setActiveStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Local items state — this is what actually drives the UI.
  // Server data is merged in smartly so reordering never causes a flicker.
  const [localItems, setLocalItems] = useState<MenuItem[]>([]);
  // Flag to prevent server data from overwriting a pending local reorder
  const reorderPending = useRef(false);
  // Debounce timer ref — accumulates drags before sending to server
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the last server-confirmed sort_orders so we only send real diffs
  const serverOrderRef = useRef<Map<string, number>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const { data: serverItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu-items'],
    queryFn: () => menuApi.getItems().then((r) => r.data.data),
  });

  const { data: managedCategories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data.data),
  });

  // Smart sync: merge server data into local state while preserving local order
  useEffect(() => {
    if (reorderPending.current) return; // don't overwrite during background save
    // Update the server order reference whenever fresh data arrives
    serverOrderRef.current = new Map(serverItems.map((i) => [i._id, i.sort_order]));
    setLocalItems((prev) => {
      if (prev.length === 0) return serverItems; // initial load
      const serverMap = new Map(serverItems.map((i) => [i._id, i]));
      // Keep existing items with fresh server data (toggles, edits), preserve local order
      const merged = prev
        .filter((i) => serverMap.has(i._id))
        .map((i) => ({ ...serverMap.get(i._id)!, sort_order: i.sort_order }));
      // Append any brand-new items from the server
      const existingIds = new Set(merged.map((i) => i._id));
      const newItems = serverItems.filter((i) => !existingIds.has(i._id));
      return [...merged, ...newItems];
    });
  }, [serverItems]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Item deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const toggleMutation = useMutation({
    mutationFn: (item: MenuItem) =>
      menuApi.updateItem(item._id, { is_active: !item.is_active }),
    // Instant local update — no waiting for server
    onMutate: (item) => {
      setLocalItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, is_active: !i.is_active } : i)),
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.error('Failed to update item');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-items'] }),
  });

  // Reorder: update local state synchronously, persist to server silently
  const reorderMutation = useMutation({
    mutationFn: (updates: { id: string; sort_order: number }[]) =>
      // Sequential saves to avoid hammering the server
      updates.reduce(
        (chain, u) => chain.then(() => menuApi.updateItem(u.id, { sort_order: u.sort_order })),
        Promise.resolve() as Promise<unknown>,
      ),
    onError: () => {
      reorderPending.current = false;
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.error('Failed to save order');
    },
    onSuccess: () => {
      reorderPending.current = false;
    },
  });

  const sorted = [...localItems].sort((a, b) =>
    a.category.name.localeCompare(b.category.name) || a.sort_order - b.sort_order,
  );
  const byCat = activeCat === 'All' ? sorted : sorted.filter((i) => i.category.name === activeCat);
  const visible = byCat.filter((i) => {
    if (activeStatus === 'active')   return i.is_active;
    if (activeStatus === 'inactive') return !i.is_active;
    return true;
  });
  const activeItem = activeId ? localItems.find((i) => i._id === activeId) ?? null : null;

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = e;
      if (!over || active.id === over.id) return;

      const draggedItem = sorted.find((i) => i._id === active.id);
      if (!draggedItem) return;

      const scope =
        activeCat === 'All'
          ? sorted
          : sorted.filter((i) => i.category._id === draggedItem.category._id);

      const fromIdx = scope.findIndex((i) => i._id === active.id);
      const toIdx = scope.findIndex((i) => i._id === over.id);
      if (fromIdx === -1 || toIdx === -1) return;

      const reordered = arrayMove(scope, fromIdx, toIdx);

      // 1. Update local state IMMEDIATELY — zero delay, no server round-trip
      const orderMap = new Map(reordered.map((item, idx) => [item._id, idx]));
      setLocalItems((prev) =>
        prev.map((item) =>
          orderMap.has(item._id) ? { ...item, sort_order: orderMap.get(item._id)! } : item,
        ),
      );

      // 2. Debounce: cancel any pending save, schedule a new one 600ms after
      //    the last drag. Only send items whose sort_order actually changed.
      reorderPending.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const diffs = reordered
          .map((item, idx) => ({ id: item._id, sort_order: idx }))
          .filter((u) => serverOrderRef.current.get(u.id) !== u.sort_order);
        if (diffs.length > 0) {
          reorderMutation.mutate(diffs);
        } else {
          reorderPending.current = false;
        }
      }, 600);
    },
    [sorted, activeCat, reorderMutation],
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-500 mt-1">
            {localItems.length} item{localItems.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-5">
        {/* Category pills */}
        {managedCategories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {['All', ...managedCategories.map((c) => c.name)].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCat === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { key: 'all',      label: 'All status' },
            { key: 'active',   label: '✓ Active' },
            { key: 'inactive', label: '✗ Inactive' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveStatus(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeStatus === key
                  ? key === 'active'   ? 'bg-green-600 text-white'
                  : key === 'inactive' ? 'bg-gray-500 text-white'
                  : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reorder hint */}
      {!isLoading && visible.length > 1 && (
        <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
          <Bars3Icon className="w-4 h-4" /> Drag the <strong>≡</strong> handle to reorder
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl shadow-sm">
          <ShoppingBagIcon className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No items yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeCat !== 'All' && activeStatus !== 'all'
              ? `No "${activeStatus}" items in "${activeCat}".`
              : activeCat !== 'All'
              ? `No items in "${activeCat}".`
              : activeStatus !== 'all'
              ? `No items matching "${activeStatus}" filter.`
              : 'Click "Add Item" to get started.'}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={visible.map((i) => i._id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map((item) => (
                <SortableCard
                  key={item._id}
                  item={item}
                  onEdit={() => setModal(item)}
                  onDelete={() => setDeleteTarget(item)}
                  onToggle={() => toggleMutation.mutate(item)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeItem ? <OverlayCard item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modals */}
      {modal && (
        <ItemModal
          initial={modal === 'add' ? undefined : modal}
          categories={managedCategories}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          item={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
