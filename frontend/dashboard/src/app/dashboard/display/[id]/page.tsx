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
import { PropertiesPanel } from '../components/PropertiesPanel';
import { ItemsPanel } from '../components/ItemsPanel';
import { SlideCanvas } from '../components/SlideCanvas';
import { SlideEditor } from '../components/SlideEditor';
import { SlidesList } from '../components/SlidesList';

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

  function handleReorderSlides(newSlides: IPlaylistSlide[]) {
    setSlides(newSlides);
    saveMutation.mutate(newSlides);
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
      <SlidesList
        slides={slides}
        isLoading={playlistLoading}
        onAddSlide={openNew}
        onEditSlide={openEdit}
        onRemoveSlide={removeSlide}
        onReorderSlides={handleReorderSlides}
      />


    </div>
  );
}
