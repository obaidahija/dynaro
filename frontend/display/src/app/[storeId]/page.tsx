/**
 * Server Component — fetches display data at request time.
 * No spinner, no client bundle for data fetching.
 * DisplayClient handles Socket.IO live updates after hydration.
 */
import type { DisplayData } from '@/components/templates/types';
import { DisplayClient } from '@/components/DisplayClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchDisplayData(
  storeId: string,
): Promise<{ data?: DisplayData; offline?: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/display/${storeId}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.offline) return { offline: true };
    if (!json.success) return { error: json.message || 'Failed to load' };
    return { data: json.data as DisplayData };
  } catch {
    return { error: 'Cannot reach the server' };
  }
}

export default async function StoreDisplay({
  params,
}: {
  params: { storeId: string };
}) {
  const { storeId } = params;
  const fetchPath = `/api/display/${storeId}`;
  const result = await fetchDisplayData(storeId);

  return (
    <DisplayClient
      initialData={result.data ?? null}
      initialOffline={result.offline ?? false}
      initialError={result.error ?? null}
      storeId={storeId}
      fetchPath={fetchPath}
    />
  );
}
