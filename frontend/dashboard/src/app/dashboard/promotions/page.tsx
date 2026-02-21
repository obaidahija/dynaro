'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { promotionApi, menuApi } from '@/lib/api';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  MegaphoneIcon,
  TagIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MenuItemRef {
  _id: string;
  name: string;
  category: string;
  price: number;
}

interface Promotion {
  _id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_time: string;
  end_time: string;
  applicable_items: MenuItemRef[];
  conditions?: {
    min_quantity?: number;
    max_uses?: number;
    current_uses: number;
  };
  display_config: {
    badge_text: string;
    badge_color: string;
    highlight_items: boolean;
    banner_image_url?: string;
    side_image_url?: string;
  };
  is_active: boolean;
  created_at: string;
}

// ── Zod schema ────────────────────────────────────────────────────────────────
const promotionFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.coerce.number().min(0, 'Must be 0 or more'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  applicable_items: z.array(z.string()).default([]),
  conditions: z.object({
    min_quantity: z.coerce.number().min(1).optional().or(z.literal('')),
    max_uses: z.coerce.number().min(1).optional().or(z.literal('')),
  }).optional(),
  display_config: z.object({
    badge_text: z.string().min(1, 'Badge text is required'),
    badge_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),
    highlight_items: z.boolean().default(true),
    banner_image_url: z.string().optional(),
    side_image_url: z.string().optional(),
  }),
  is_active: z.boolean().default(true),
}).refine((d) => {
  if (!d.start_time || !d.end_time) return true;
  return new Date(d.end_time) > new Date(d.start_time);
}, { message: 'End time must be after start time', path: ['end_time'] });

type PromotionForm = z.infer<typeof promotionFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDatetimeLocal(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISO(local: string) {
  if (!local) return '';
  return new Date(local).toISOString();
}

function getStatus(p: Promotion): 'active' | 'scheduled' | 'expired' {
  const now = Date.now();
  const start = new Date(p.start_time).getTime();
  const end = new Date(p.end_time).getTime();
  if (now > end) return 'expired';
  if (now < start) return 'scheduled';
  return 'active';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PRESET_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444'];

// ── Modal ─────────────────────────────────────────────────────────────────────
function PromotionModal({
  editing,
  menuItems,
  onClose,
  onSave,
  saving,
}: {
  editing: Promotion | null;
  menuItems: MenuItemRef[];
  onClose: () => void;
  onSave: (data: PromotionForm) => void;
  saving: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromotionForm>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          discount_type: editing.discount_type,
          discount_value: editing.discount_value,
          start_time: toDatetimeLocal(editing.start_time),
          end_time: toDatetimeLocal(editing.end_time),
          applicable_items: editing.applicable_items.map((i) => i._id),
          conditions: {
            min_quantity: editing.conditions?.min_quantity ?? '',
            max_uses: editing.conditions?.max_uses ?? '',
          },
          display_config: {
            badge_text: editing.display_config.badge_text,
            badge_color: editing.display_config.badge_color,
            highlight_items: editing.display_config.highlight_items,
            banner_image_url: editing.display_config.banner_image_url ?? '',
            side_image_url: editing.display_config.side_image_url ?? '',
          },
          is_active: editing.is_active,
        }
      : {
          discount_type: 'percentage',
          discount_value: 10,
          applicable_items: [],
          display_config: { badge_text: 'SALE', badge_color: '#F59E0B', highlight_items: true, banner_image_url: '', side_image_url: '' },
          is_active: true,
        },
  });

  const discountType = watch('discount_type');
  const badgeColor = watch('display_config.badge_color');
  const selectedItems = watch('applicable_items');

  // Group menu items by category
  const grouped = menuItems.reduce<Record<string, MenuItemRef[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const toggleItem = (id: string) => {
    const next = selectedItems.includes(id)
      ? selectedItems.filter((x) => x !== id)
      : [...selectedItems, id];
    setValue('applicable_items', next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? 'Edit Promotion' : 'New Promotion'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSave)} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promotion name</label>
            <input
              {...register('name')}
              placeholder="e.g. Summer Sale"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
            <div className="flex gap-2">
              {/* Type toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setValue('discount_type', 'percentage')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setValue('discount_type', 'fixed')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  $
                </button>
              </div>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {discountType === 'percentage' ? '%' : '$'}
                </span>
                <input
                  {...register('discount_value')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={discountType === 'percentage' ? '10' : '5.00'}
                  className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {errors.discount_value && <p className="text-xs text-red-500 mt-1">{errors.discount_value.message}</p>}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
              <input
                {...register('start_time')}
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.start_time && <p className="text-xs text-red-500 mt-1">{errors.start_time.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
              <input
                {...register('end_time')}
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.end_time && <p className="text-xs text-red-500 mt-1">{errors.end_time.message}</p>}
            </div>
          </div>

          {/* Badge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display badge</label>
            <div className="flex gap-3 items-center">
              <input
                {...register('display_config.badge_text')}
                placeholder="SALE"
                maxLength={12}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Color presets */}
              <div className="flex gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('display_config.badge_color', c)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: badgeColor === c ? '#1d4ed8' : 'transparent',
                    }}
                  />
                ))}
              </div>
              {/* Custom color */}
              <input
                {...register('display_config.badge_color')}
                type="color"
                className="w-8 h-8 rounded border cursor-pointer"
              />
            </div>
            {/* Preview */}
            <div className="mt-2">
              <span
                className="inline-block text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: badgeColor || '#EF4444' }}
              >
                {watch('display_config.badge_text') || 'SALE'}
              </span>
            </div>
            {errors.display_config?.badge_text && (
              <p className="text-xs text-red-500 mt-1">{errors.display_config.badge_text.message}</p>
            )}
            {errors.display_config?.badge_color && (
              <p className="text-xs text-red-500 mt-1">{errors.display_config.badge_color.message}</p>
            )}
          </div>

          {/* Promotion images */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Promotion images <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Background image URL</label>
              <input
                {...register('display_config.banner_image_url')}
                placeholder="https://…/banner.jpg"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">Fills the entire banner background</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Side image URL</label>
              <input
                {...register('display_config.side_image_url')}
                placeholder="https://…/product.png"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">Displayed on the left side of the banner (overrides item image)</p>
            </div>
          </div>

          {/* Highlight items toggle */}
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="display_config.highlight_items"
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${field.value ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.value ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </button>
              )}
            />
            <span className="text-sm text-gray-700">Highlight applicable items on display</span>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conditions (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min. quantity</label>
                <input
                  {...register('conditions.min_quantity')}
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max uses total</label>
                <input
                  {...register('conditions.max_uses')}
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Applicable items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applicable items
              <span className="ml-1 text-xs text-gray-400 font-normal">(leave empty = applies to all)</span>
            </label>
            {menuItems.length === 0 ? (
              <p className="text-sm text-gray-400">No menu items found</p>
            ) : (
              <div className="border rounded-lg max-h-44 overflow-y-auto divide-y">
                {Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase bg-gray-50">{cat}</p>
                    {items.map((item) => {
                      const checked = selectedItems.includes(item._id);
                      return (
                        <label
                          key={item._id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <div
                            className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                            onClick={() => toggleItem(item._id)}
                          >
                            {checked && <CheckCircleSolid className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                          <span className="text-xs text-gray-400">
                            ${item.price.toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 pt-1">
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${field.value ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.value ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </button>
              )}
            />
            <span className="text-sm text-gray-700">Active</span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit(onSave)}
            className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create promotion'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Promotion card ─────────────────────────────────────────────────────────────
function PromotionCard({
  promo,
  onEdit,
  onToggle,
  onDelete,
}: {
  promo: Promotion;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const status = getStatus(promo);
  const isExpired = status === 'expired';
  const isRunning = status === 'active' && promo.is_active;
  const isPaused = !promo.is_active && !isExpired;
  const accentColor = isExpired || isPaused ? '#9CA3AF' : promo.display_config.badge_color;

  return (
    <div className={`bg-white rounded-2xl shadow-sm flex overflow-hidden transition-all hover:shadow-md ${
      isExpired ? 'opacity-60' : ''
    }`}>

      {/* Left: colored discount panel */}
      <div
        className="w-28 flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 py-5"
        style={{ backgroundColor: accentColor }}
      >
        <span className="text-white font-black text-4xl leading-none text-center">
          {promo.discount_type === 'percentage'
            ? `${promo.discount_value}%`
            : `$${promo.discount_value % 1 === 0 ? promo.discount_value : promo.discount_value.toFixed(2)}`}
        </span>
        <span className="text-white/75 text-xs font-bold tracking-widest uppercase">off</span>
        <span
          className="mt-2 text-xs font-bold px-2 py-0.5 rounded text-white truncate max-w-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}
        >
          {promo.display_config.badge_text}
        </span>
      </div>

      {/* Dashed separator */}
      <div className="flex-shrink-0 w-0 border-l-2 border-dashed border-gray-200 my-3" />

      {/* Right: details */}
      <div className="flex-1 px-4 py-4 min-w-0 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isRunning && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
            {status === 'scheduled' && (
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <ClockIcon className="w-3 h-3" />
                Scheduled
              </span>
            )}
            {isExpired && (
              <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">Expired</span>
            )}
            {isPaused && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Paused</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={onToggle}
              title={promo.is_active ? 'Pause' : 'Activate'}
              className={`relative w-8 h-4 rounded-full transition-colors ${
                promo.is_active ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                promo.is_active ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Name */}
        <p className="font-semibold text-gray-800 truncate mb-2.5">{promo.name}</p>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
          <CalendarDaysIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {new Date(promo.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' → '}
            {new Date(promo.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Applicable items */}
        {promo.applicable_items.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <TagIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {promo.applicable_items.slice(0, 3).map((i) => i.name).join(', ')}
              {promo.applicable_items.length > 3 && (
                <span className="text-gray-300"> +{promo.applicable_items.length - 3}</span>
              )}
            </span>
          </div>
        )}

        {/* Usage bar */}
        {promo.conditions?.max_uses && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Uses</span>
              <span className="font-medium">{promo.conditions.current_uses ?? 0} / {promo.conditions.max_uses}</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((promo.conditions.current_uses ?? 0) / promo.conditions.max_uses) * 100)}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
type Filter = 'all' | 'running' | 'scheduled' | 'expired' | 'paused';

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ['promotions'],
    queryFn: () => promotionApi.getAll().then((r) => r.data.data),
  });

  const { data: menuItems = [] } = useQuery<MenuItemRef[]>({
    queryKey: ['menu-items-simple'],
    queryFn: () => menuApi.getAll().then((r) => r.data.data),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ['promotions'] });

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => promotionApi.create(data),
    onSuccess: () => { invalidate(); toast.success('Promotion created!'); closeModal(); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'Failed to create'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => promotionApi.update(id, data),
    onSuccess: () => { invalidate(); toast.success('Promotion updated!'); closeModal(); },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => promotionApi.toggle(id),
    onSuccess: () => invalidate(),
    onError: () => toast.error('Failed to toggle'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => promotionApi.delete(id),
    onSuccess: () => { invalidate(); toast.success('Promotion deleted'); setDeletingId(null); },
    onError: () => toast.error('Failed to delete'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const closeModal = () => { setModalOpen(false); setEditing(null); };
  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Promotion) => { setEditing(p); setModalOpen(true); };

  const onSave = (formData: PromotionForm) => {
    // Clean up empty condition fields, convert datetimes to ISO
    const conditions: Record<string, number> = {};
    if (formData.conditions?.min_quantity && String(formData.conditions.min_quantity) !== '') {
      conditions.min_quantity = Number(formData.conditions.min_quantity);
    }
    if (formData.conditions?.max_uses && String(formData.conditions.max_uses) !== '') {
      conditions.max_uses = Number(formData.conditions.max_uses);
    }

    const payload: Record<string, unknown> = {
      name: formData.name,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      start_time: toISO(formData.start_time),
      end_time: toISO(formData.end_time),
      applicable_items: formData.applicable_items,
      display_config: formData.display_config,
      is_active: formData.is_active,
      ...(Object.keys(conditions).length > 0 ? { conditions } : {}),
    };

    if (editing) {
      updateMut.mutate({ id: editing._id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filtered = promotions.filter((p) => {
    if (filter === 'all') return true;
    const s = getStatus(p);
    if (filter === 'running') return s === 'active' && p.is_active;
    if (filter === 'scheduled') return s === 'scheduled';
    if (filter === 'expired') return s === 'expired';
    if (filter === 'paused') return !p.is_active && s !== 'expired';
    return true;
  });

  const counts = {
    all: promotions.length,
    running: promotions.filter((p) => getStatus(p) === 'active' && p.is_active).length,
    scheduled: promotions.filter((p) => getStatus(p) === 'scheduled').length,
    expired: promotions.filter((p) => getStatus(p) === 'expired').length,
    paused: promotions.filter((p) => !p.is_active && getStatus(p) !== 'expired').length,
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',       label: `All (${counts.all})` },
    { key: 'running',   label: `Running (${counts.running})` },
    { key: 'scheduled', label: `Scheduled (${counts.scheduled})` },
    { key: 'paused',    label: `Paused (${counts.paused})` },
    { key: 'expired',   label: `Expired (${counts.expired})` },
  ];

  const saving = createMut.isPending || updateMut.isPending;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create discounts and special offers for your menu</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          New promotion
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl shadow-sm h-24 flex overflow-hidden animate-pulse">
              <div className="w-28 bg-gray-200" />
              <div className="w-px border-l-2 border-dashed border-gray-100 my-3" />
              <div className="flex-1 p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MegaphoneIcon className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">
            {filter === 'all' ? 'No promotions yet' : `No ${filter} promotions`}
          </p>
          {filter === 'all' && (
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Create your first promotion
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <PromotionCard
              key={p._id}
              promo={p}
              onEdit={() => openEdit(p)}
              onToggle={() => toggleMut.mutate(p._id)}
              onDelete={() => setDeletingId(p._id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <PromotionModal
          editing={editing}
          menuItems={menuItems}
          onClose={closeModal}
          onSave={onSave}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete promotion?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone. The promotion will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deletingId)}
                disabled={deleteMut.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
