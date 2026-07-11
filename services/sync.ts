import { apiClient } from '@/services/api-client';
import { hydrateFromServer, setMode } from '@/services/storage';

/**
 * Session-aware cache sync. On first data access per page load, the client
 * asks /api/bootstrap for the signed-in user's data:
 *
 *   200 → hydrate localStorage from the server and enter "cloud" mode
 *         (all subsequent writes go write-through to the API);
 *   401 → signed out: stay in "demo" mode, localStorage only;
 *   network error → keep whatever is cached locally so the UI still renders.
 *
 * The promise is memoized so many hooks mounting at once trigger one fetch.
 */

let syncPromise: Promise<void> | null = null;

export function ensureSynced(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  syncPromise ??= (async () => {
    try {
      const payload = await apiClient.bootstrap();
      if (payload) {
        hydrateFromServer(payload);
        setMode('cloud');
      } else {
        setMode('demo');
      }
    } catch {
      // Offline or server error: leave the local cache untouched.
    }
  })();
  return syncPromise;
}

/** Forget the memoized sync (after sign-in/sign-out) so the next read re-syncs. */
export function resetSync(): void {
  syncPromise = null;
}
