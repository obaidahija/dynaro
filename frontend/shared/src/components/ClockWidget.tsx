'use client';

import React, { useState, useEffect } from 'react';

interface ClockWidgetProps {
  liveClock: boolean;
  mockSizes: boolean;
}

export function ClockWidget({ liveClock, mockSizes }: ClockWidgetProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!liveClock) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [liveClock]);

  const timeStr = liveClock
    ? (now ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00')
    : '12:00';
  const dateStr = liveClock
    ? (now ? now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) : 'Monday, Jan 1')
    : 'Monday, Jan 1';

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        color: '#fff',
        fontWeight: 900,
        fontSize: mockSizes ? '1.2rem' : '1.5rem',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
      }}>
        {timeStr}
      </div>
      <div style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: mockSizes ? '0.65rem' : '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        {dateStr}
      </div>
    </div>
  );
}
