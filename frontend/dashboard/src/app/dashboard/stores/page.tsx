'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { superadminApi, storeTypeApi } from '@/lib/api';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  BuildingStorefrontIcon,
  PowerIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

// ── Types ──────────────────────────────────────────────────────────────────────
interface IStoreType { id: string; name: string; }

interface Store {
  _id: string;
  name: string;
  timezone: string;
  store_type: string;
  is_active: boolean;
  created_at: string;
  owner_id: {
    _id: string;
    name: string;
    email: string;
  } | null;
}

// ── Zod schema ─────────────────────────────────────────────────────────────────
const createStoreSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  timezone: z.string().min(1, 'Timezone is required'),
  storeType: z.string().min(1, 'Store type is required'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerEmail: z.string().email('Invalid email address'),
  ownerPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
type CreateStoreForm = z.infer<typeof createStoreSchema>;

const editStoreSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  timezone: z.string().min(1, 'Timezone is required'),
  storeType: z.string().min(1, 'Store type is required'),
});
type EditStoreForm = z.infer<typeof editStoreSchema>;

// ── Modal ──────────────────────────────────────────────────────────────────────
function AddStoreModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: storeTypes = [] } = useQuery<IStoreType[]>({
    queryKey: ['store-types'],
    queryFn: () => storeTypeApi.getAll().then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStoreForm>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: { timezone: 'UTC', storeType: 'other' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateStoreForm) =>
      superadminApi.createStore({
        storeName: data.storeName,
        timezone: data.timezone,
        store_type: data.storeType,
        owner: {
          name: data.ownerName,
          email: data.ownerEmail,
          password: data.ownerPassword,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-stores'] });
      queryClient.invalidateQueries({ queryKey: ['all-owners'] });
      toast.success('Store and owner created successfully!');
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to create store');
    },
  });

  const onSubmit = (data: CreateStoreForm) => mutation.mutate(data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add New Store</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {/* Store Info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Store Details</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  {...register('storeName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Coffee House"
                />
                {errors.storeName && <p className="mt-1 text-xs text-red-500">{errors.storeName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Type</label>
                <select
                  {...register('storeType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {storeTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.storeType && <p className="mt-1 text-xs text-red-500">{errors.storeType.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  {...register('timezone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (ET)</option>
                  <option value="America/Chicago">America/Chicago (CT)</option>
                  <option value="America/Denver">America/Denver (MT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                </select>
                {errors.timezone && <p className="mt-1 text-xs text-red-500">{errors.timezone.message}</p>}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Owner Info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Owner Account</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  {...register('ownerName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Jane Smith"
                />
                {errors.ownerName && <p className="mt-1 text-xs text-red-500">{errors.ownerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('ownerEmail')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="owner@example.com"
                />
                {errors.ownerEmail && <p className="mt-1 text-xs text-red-500">{errors.ownerEmail.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  {...register('ownerPassword')}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min. 6 characters"
                />
                {errors.ownerPassword && <p className="mt-1 text-xs text-red-500">{errors.ownerPassword.message}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending ? 'Creating…' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit store modal ───────────────────────────────────────────────────────────
function EditStoreModal({ store, onClose }: { store: Store; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: storeTypes = [] } = useQuery<IStoreType[]>({
    queryKey: ['store-types'],
    queryFn: () => storeTypeApi.getAll().then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditStoreForm>({
    resolver: zodResolver(editStoreSchema),
    defaultValues: {
      storeName: store.name,
      timezone: store.timezone,
      storeType: store.store_type || 'other',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EditStoreForm) =>
      superadminApi.updateStore(store._id, {
        storeName: data.storeName,
        timezone: data.timezone,
        store_type: data.storeType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-stores'] });
      toast.success('Store updated');
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to update store');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit Store</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input
              {...register('storeName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.storeName && <p className="mt-1 text-xs text-red-500">{errors.storeName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Type</label>
            <select
              {...register('storeType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {storeTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.storeType && <p className="mt-1 text-xs text-red-500">{errors.storeType.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              {...register('timezone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (ET)</option>
              <option value="America/Chicago">America/Chicago (CT)</option>
              <option value="America/Denver">America/Denver (MT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
            </select>
            {errors.timezone && <p className="mt-1 text-xs text-red-500">{errors.timezone.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation ────────────────────────────────────────────────────────
function DeleteConfirm({
  store,
  onCancel,
  onConfirm,
  loading,
}: {
  store: Store;
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
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Delete Store</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Are you sure you want to delete <strong>{store.name}</strong>? This cannot be undone.
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

// ── Main page ──────────────────────────────────────────────────────────────────
export default function StoresPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Store | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);

  const { data: storeTypesList = [] } = useQuery<IStoreType[]>({
    queryKey: ['store-types'],
    queryFn: () => storeTypeApi.getAll().then((r) => r.data.data),
  });
  const storeTypeMap = Object.fromEntries(storeTypesList.map((t) => [t.id, t.name]));

  const { data: stores, isLoading } = useQuery<Store[]>({
    queryKey: ['all-stores'],
    queryFn: () => superadminApi.getStores().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => superadminApi.deleteStore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-stores'] });
      toast.success('Store deleted');
      setDeleteTarget(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to delete store');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => superadminApi.toggleStoreActive(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['all-stores'] });
      toast.success(res.data.message || 'Store status updated');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to update store status');
    },
  });

  const storeList = Array.isArray(stores) ? stores : [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          <p className="text-gray-500 mt-1">{storeList.length} store{storeList.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add Store
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : storeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BuildingStorefrontIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No stores yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Store" to create the first one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Store</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timezone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {storeList.map((store) => (
                <tr key={store._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BuildingStorefrontIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{store.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {store.store_type ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {storeTypeMap[store.store_type] || store.store_type}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {store.owner_id ? (
                      <div>
                        <p className="font-medium text-gray-900">{store.owner_id.name}</p>
                        <p className="text-xs text-gray-400">{store.owner_id.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{store.timezone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                        store.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${store.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {store.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {store.created_at
                      ? new Date(store.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTarget(store)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit store"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(store._id)}
                        disabled={toggleMutation.isPending}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          store.is_active
                            ? 'text-green-600 hover:bg-red-50 hover:text-red-600'
                            : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                        }`}
                        title={store.is_active ? 'Deactivate store' : 'Activate store'}
                      >
                        <PowerIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(store)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete store"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddStoreModal onClose={() => setShowAdd(false)} />}
      {editTarget && <EditStoreModal store={editTarget} onClose={() => setEditTarget(null)} />}
      {deleteTarget && (
        <DeleteConfirm
          store={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
