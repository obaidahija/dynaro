'use client';

/**
 * ModernGrid — thin wrapper that delegates to LayoutRenderer.
 * The template registry maps "modern-grid" → this component.
 * All display logic now lives in LayoutRenderer + block components.
 */
import type { DisplayData } from './types';
import { LayoutRenderer } from '../LayoutRenderer';

export function ModernGrid({ data }: { data: DisplayData }) {
  return <LayoutRenderer data={data} />;
}
