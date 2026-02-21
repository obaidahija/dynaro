'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { storeApi, playlistApi } from '@/lib/api';
import {
  PlusIcon, TrashIcon, PencilIcon, TvIcon, ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

// ── Types ─────────────────────────────────────────────────────────────────────

interface IPlaylist {
  _id: string;
  name: string;
  slides: { _id?: string; label?: string }[];
  created_at: string;
}

interface IStore {
  _id: string;
  name: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DisplayPlaylistsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: store } = useQuery<IStore>({
    queryKey: ['my-store'],
    queryFn: () => storeApi.getMyStore().then((r) => r.data.data ?? r.data),
  });

  const { data: playlists = [], isLoading } = useQuery<IPlaylist[]>({
    queryKey: ['playlists'],
    queryFn: () => playlistApi.getAll().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => playlistApi.create(name),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist created');
      setNewName('');
      setCreating(false);
      router.push(`/dashboard/display/${res.data.data._id}`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to create playlist');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => playlistApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    },
  });

  const DISPLAY_BASE = process.env.NEXT_PUBLIC_DISPLAY_URL || 'http://localhost:3002';

  function copyUrl(playlistId: string) {
    if (!store) return;
    const url = `${DISPLAY_BASE}/${store._id}/${playlistId}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Display URL copied!'));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Display Playlists</h1>
          <p className="text-gray-500 mt-1">
            Create playlists and run them on different TVs using a unique display URL.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          New Playlist
        </button>
      </div>

      {/* New playlist inline form */}
      {creating && (
        <form onSubmit={handleCreate} className="flex items-center gap-3 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name (e.g. Lunch Menu, Happy Hour…)"
            className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newName.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => { setCreating(false); setNewName(''); }}
            className="px-3 py-2 text-gray-500 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Playlist list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl text-center">
          <TvIcon className="w-14 h-14 text-gray-200 mb-3" />
          <p className="text-gray-500 font-semibold text-lg">No playlists yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create a playlist, add slides, then put the display URL on your TV.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Create first playlist
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map((pl) => {
            const displayUrl = store ? `${DISPLAY_BASE}/${store._id}/${pl._id}` : null;
            return (
              <div
                key={pl._id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <TvIcon className="w-5 h-5 text-blue-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{pl.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pl.slides.length} slide{pl.slides.length !== 1 ? 's' : ''}
                  </p>
                  {displayUrl && (
                    <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{displayUrl}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyUrl(pl._id)}
                    title="Copy display URL"
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/display/${pl._id}`)}
                    title="Edit slides"
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${pl.name}"?`)) deleteMutation.mutate(pl._id);
                    }}
                    title="Delete playlist"
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
