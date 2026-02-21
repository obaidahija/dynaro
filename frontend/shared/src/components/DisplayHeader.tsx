'use client';

import React, { useState, useEffect } from 'react';
import type { ILayoutHeader } from '../display-types';

const NAME_SIZES: Record<string, string> = { sm: '1.0rem', md: '1.55rem', lg: '2.1rem', xl: '2.7rem' };
// Scaled-down sizes for dashboard mock preview (em-based)
const MOCK_NAME_SIZES: Record<string, string> = { sm: '0.6em', md: '0.82em', lg: '1.05em', xl: '1.3em' };

export interface DisplayHeaderProps {
  layout: ILayoutHeader;
  storeName: string;
  logoUrl?: string;
  primaryColor: string;
  activeCat?: string;
  /** When true renders a live clock; when false renders a static placeholder ("12:00") */
  liveClock?: boolean;
  /** Use em-based font sizes (for dashboard mock preview) vs rem-based (for live display) */
  mockSizes?: boolean;
}

export function DisplayHeader({
  layout,
  storeName,
  logoUrl,
  primaryColor,
  activeCat,
  liveClock = true,
  mockSizes = false,
}: DisplayHeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (!liveClock) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [liveClock]);

  if (!layout.visible) return null;

  const sizeMap = mockSizes ? MOCK_NAME_SIZES : NAME_SIZES;
  const nameFontSize = sizeMap[layout.name_size ?? 'md'];

  const timeStr = liveClock
    ? (now ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
    : '12:00';
  const dateStr = liveClock
    ? (now ? now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : '')
    : 'Monday, Jan 1';

  const showName = layout.show_name && (liveClock ? hydrated : true);

  return (
    <div
      style={{
        flexShrink: 0,
        height: mockSizes ? '56px' : '72px',
        padding: '0 4%',
        background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}bb 35%, ${primaryColor}44 65%, transparent 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: logo + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: mockSizes ? '12px' : '16px' }}>
        {layout.show_logo && (
          logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} style={{ height: mockSizes ? '32px' : '36px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: mockSizes ? '32px' : '40px',
              height: mockSizes ? '32px' : '40px',
              borderRadius: mockSizes ? '4px' : '12px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: mockSizes ? '1rem' : '1.25rem',
            }}>
              {storeName[0]?.toUpperCase() ?? 'S'}
            </div>
          )
        )}

        {showName && (
          <div>
            <div style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: nameFontSize,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1.1,
            }}>
              {storeName}
              <span style={{ marginLeft: '0.5em', opacity: 0.6, fontWeight: 800 }}>MENU</span>
            </div>
            {activeCat && (
              <div style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: mockSizes ? '0.5em' : '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '1px',
              }}>
                {activeCat}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: clock */}
      {layout.show_clock && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: mockSizes ? '1.2rem' : '1.5rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
            {timeStr}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: mockSizes ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {dateStr}
          </div>
        </div>
      )}
    </div>
  );
}
