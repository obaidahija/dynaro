'use client';

/**
 * DisplayClient — thin client wrapper around LayoutRenderer.
 *
 * The server component (page.tsx) fetches the initial data and passes it here.
 * This component's only job is to:
 *   1. Subscribe to Socket.IO so the display reacts to store changes in real-time.
 *   2. Re-schedule a fetch when the next promotion is about to expire.
 *   3. Keep the displayed data up-to-date after hydration.
 *
 * All slide cycling / animation logic stays inside LayoutRenderer.
 */

import { useState, useEffect, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { DisplayData } from './templates/types';
import { LayoutRenderer } from './LayoutRenderer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface DisplayClientProps {
  /** Data pre-fetched on the server — rendered immediately with no spinner. */
  initialData: DisplayData | null;
  initialOffline: boolean;
  initialError: string | null;
  storeId: string;
  /** Path to re-fetch, e.g. /api/display/:storeId or /api/display/:storeId/:playlistId */
  fetchPath: string;
}

export function DisplayClient({
  initialData,
  initialOffline,
  initialError,
  storeId,
  fetchPath,
}: DisplayClientProps) {
  const [data, setData] = useState<DisplayData | null>(initialData);
  const [offline, setOffline] = useState(initialOffline);
  const [error, setError] = useState<string | null>(initialError);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}${fetchPath}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.offline) {
        setOffline(true);
        setData(null);
      } else if (!json.success) {
        setError(json.message || 'Failed to load');
      } else {
        setData(json.data as DisplayData);
        setOffline(false);
        setError(null);
      }
    } catch {
      setError('Cannot reach the server');
    }
  }, [fetchPath]);

  // Re-fetch at the exact moment the next promotion expires / starts
  useEffect(() => {
    if (!data) return;
    const now = Date.now();
    const times: number[] = [];
    for (const p of data.promotions ?? []) {
      const end   = new Date(p.end_time).getTime();
      const start = new Date(p.start_time).getTime();
      if (end   > now) times.push(end);
      if (start > now) times.push(start);
    }
    if (times.length === 0) return;
    const nextMs = Math.min(...times) - now + 500;
    const t = setTimeout(() => load(), nextMs);
    return () => clearTimeout(t);
  }, [data, load]);

  // Socket.IO — listen for live store updates
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io(API_URL, { transports: ['websocket', 'polling'] });
      socket.on('connect', () => socket!.emit('join-store', storeId));
      socket.on('update', (event: { store_id: string }) => {
        if (event.store_id === storeId) load();
      });
    } catch {
      // Non-fatal — polling still works
    }
    return () => {
      if (socket) {
        socket.emit('leave-store', storeId);
        socket.disconnect();
      }
    };
  }, [storeId, load]);

  // ── Offline ───────────────────────────────────────────────────────────────
  if (offline) {
    return (
      <div className="h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-white text-center px-8">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-2 text-5xl">
          📺
        </div>
        <h1 className="text-4xl font-bold">Store is Offline</h1>
        <p className="text-gray-500 text-xl">
          This display will resume automatically when the store is active.
        </p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="h-screen bg-gray-950 flex flex-col items-center justify-center gap-3 text-white text-center px-8">
        <h1 className="text-3xl font-bold">Display Unavailable</h1>
        <p className="text-gray-500">{error || 'Store not found'}</p>
        <p className="text-gray-700 text-sm mt-2 font-mono">{API_URL}{fetchPath}</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return <LayoutRenderer data={data} />;
}
