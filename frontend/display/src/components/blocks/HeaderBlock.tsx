'use client';

import type { ILayoutHeader, DisplayStore } from '../templates/types';
import { DisplayHeader } from '@shared/components/DisplayHeader';

interface HeaderBlockProps {
  layout: ILayoutHeader;
  store: DisplayStore;
  activeCat?: string;
}

export function HeaderBlock({ layout, store, activeCat }: HeaderBlockProps) {
  const primary = store.branding.primary_color || '#3B82F6';

  return (
    <DisplayHeader
      layout={layout}
      storeName={store.name}
      logoUrl={store.branding.logo_url}
      primaryColor={primary}
      activeCat={activeCat}
      liveClock={true}
      mockSizes={false}
    />
  );
}
