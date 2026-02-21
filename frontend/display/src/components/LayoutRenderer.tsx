'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { DisplayData, ILayoutConfig, DisplayMenuItem } from './templates/types';
import { DEFAULT_LAYOUT } from './templates/types';
import { HeaderBlock } from './blocks/HeaderBlock';

const BG_THEMES: Record<string, string> = {
  dark:     'linear-gradient(160deg, #071020 0%, #0c1e40 50%, #071020 100%)',
  ocean:    'linear-gradient(160deg, #06141e 0%, #0a2d45 50%, #06141e 100%)',
  midnight: 'linear-gradient(160deg, #0e0b1a 0%, #1e1a3d 50%, #0e0b1a 100%)',
  forest:   'linear-gradient(160deg, #071a0f 0%, #0d3020 50%, #071a0f 100%)',
  ember:    'linear-gradient(160deg, #1a0a05 0%, #3d1810 50%, #1a0a05 100%)',
};
import { MenuGridBlock } from './blocks/MenuGridBlock';
import { FlashSaleBlock } from './blocks/FlashSaleBlock';

const KEYFRAMES = `
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes shimmer {
    0%, 100% { opacity: 0; }
    50%       { opacity: 1; }
  }
  @keyframes bannerIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
`;

interface LayoutRendererProps {
  data: DisplayData;
  /** Override layout — falls back to store.layout, then DEFAULT_LAYOUT */
  layout?: ILayoutConfig;
}

export function LayoutRenderer({ data, layout: layoutOverride }: LayoutRendererProps) {
  const { store, menuItems, promotions, playlist } = data;
  const primary = store.branding.primary_color || '#3B82F6';

  // ── Playlist mode ─────────────────────────────────────────────────────────
  const hasPlaylist = Array.isArray(playlist) && playlist.length > 0;

  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [gridVisible, setGridVisible] = useState(true);
  const [gridKey, setGridKey] = useState(0);
  const slideIndexRef = useRef(0);

  const transition = useCallback((nextIdx: number) => {
    setGridVisible(false);
    setTimeout(() => {
      slideIndexRef.current = nextIdx;
      setPlaylistIndex(nextIdx);
      setGridKey((k) => k + 1);
      setGridVisible(true);
    }, 420);
  }, []);

  // Auto-cycle playlist slides using per-slide duration
  useEffect(() => {
    if (!hasPlaylist || playlist!.length <= 1) return;
    const currentDuration = (playlist![slideIndexRef.current]?.duration_sec ?? 9) * 1000;
    const t = setTimeout(() => {
      const next = (slideIndexRef.current + 1) % playlist!.length;
      transition(next);
    }, currentDuration);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPlaylist, playlistIndex, transition]);

  // Active playlist slide
  const activeSlide = hasPlaylist ? playlist![playlistIndex] : null;
  const layout: ILayoutConfig = activeSlide?.layout ?? layoutOverride ?? store.layout ?? DEFAULT_LAYOUT;
  const activeItems: DisplayMenuItem[] = activeSlide ? activeSlide.items : menuItems;

  // ── Global page cycling (non-playlist mode) ───────────────────────────────
  const capacity = (layout.main.columns ?? 3) * (layout.main.rows ?? 2);
  const globalPageCount = useMemo(() => Math.max(1, Math.ceil(activeItems.length / capacity)), [activeItems.length, capacity]);
  const [globalPage, setGlobalPage] = useState(0);
  const globalPageRef = useRef(0);

  const transitionGlobal = useCallback((nextPage: number) => {
    setGridVisible(false);
    setTimeout(() => {
      globalPageRef.current = nextPage;
      setGlobalPage(nextPage);
      setGridKey((k) => k + 1);
      setGridVisible(true);
    }, 420);
  }, []);

  useEffect(() => {
    if (hasPlaylist || globalPageCount <= 1) return;
    const t = setInterval(() => {
      const next = (globalPageRef.current + 1) % globalPageCount;
      transitionGlobal(next);
    }, 9000);
    return () => clearInterval(t);
  }, [hasPlaylist, globalPageCount, transitionGlobal]);

  const activePage = hasPlaylist ? 0 : globalPage;

  // Active category label(s)
  const activeCat = useMemo(() => {
    const offset = activePage * capacity;
    const pageItems = activeItems.slice(offset, offset + capacity);
    const cats = Array.from(new Set(
      pageItems.map((m) =>
        typeof m.category === 'object' && m.category !== null ? m.category.name : String(m.category ?? '')
      ).filter(Boolean)
    ));
    return cats.join(' · ');
  }, [activeItems, activePage, capacity]);

  // ── Promo cycling ─────────────────────────────────────────────────────────
  const [promoIndex, setPromoIndex] = useState(0);
  useEffect(() => {
    if (promotions.length <= 1) return;
    const t = setInterval(() => setPromoIndex((p) => (p + 1) % promotions.length), 8000);
    return () => clearInterval(t);
  }, [promotions.length]);

  const activePromo = promotions.length > 0 ? promotions[promoIndex] : null;
  const showBanner = layout.banner.visible && !!activePromo;

  // ── Render ────────────────────────────────────────────────────────────────
  const bannerBlock = showBanner && activePromo ? (
    <FlashSaleBlock
      key={activePromo._id}
      layout={layout.banner}
      promotion={activePromo}
      menuItems={activeItems}
      primary={primary}
      promoCount={promotions.length}
      promoIndex={promoIndex}
    />
  ) : null;

  const mainBlock = (
    <MenuGridBlock
      layout={layout.main}
      items={activeItems}
      promotions={promotions}
      activePage={activePage}
      gridVisible={gridVisible}
      gridKey={gridKey}
      hasBanner={showBanner}
      itemColors={activeSlide?.item_colors}
      itemSizes={activeSlide?.item_sizes}
      itemTags={activeSlide?.item_tags}
    />
  );

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden select-none"
      style={{
        background: BG_THEMES[layout.bg_theme ?? 'dark'],
        fontFamily: `${store.branding.font_family || 'Inter'}, sans-serif`,
      }}
    >
      <style>{KEYFRAMES}</style>

      {showBanner && layout.banner.position === 'top' && bannerBlock}

      <HeaderBlock
        layout={layout.header}
        store={store}
        activeCat={activeSlide?.label || activeCat}
      />

      {mainBlock}

      {showBanner && layout.banner.position === 'bottom' && bannerBlock}
    </div>
  );
}
