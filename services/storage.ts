import { demoChat, demoMarks, demoStudent } from '@/data/demo';
import type { ChatMessage, MockTestAttempt, ReportCard, Student, StudyPlan } from '@/types/models';

/**
 * Client repository: localStorage-backed with the same synchronous interface
 * the UI has always used. Since Phase 1, localStorage is a CACHE, not the
 * source of truth:
 *
 *  - "demo" mode (signed out): localStorage only — the original behavior.
 *  - "cloud" mode (signed in): reads come from the cache hydrated by
 *    services/sync.ts, and every write also fires a write-through API call
 *    persisting to PostgreSQL.
 *
 * Pages never import the API client directly; this module is the seam.
 */

const KEYS = {
  student: 'student',
  report: 'report',
  chat: 'chat',
  plan: 'plan',
  attempts: 'attempts',
} as const;

const MODE_KEY = 'mentora-mode';
const DEMO_COOKIE = 'mentora-demo';

export type StorageMode = 'demo' | 'cloud';

const isBrowser = () => typeof window !== 'undefined';

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or blocked (private mode); the app keeps working in memory.
  }
}

function remove(key: string): void {
  if (isBrowser()) localStorage.removeItem(key);
}

export function getMode(): StorageMode {
  return read<StorageMode>(MODE_KEY, 'demo') === 'cloud' ? 'cloud' : 'demo';
}

export function setMode(mode: StorageMode): void {
  write(MODE_KEY, mode);
}

/** Demo cookie lets signed-out demo users through the route-protection middleware. */
function setDemoCookie(): void {
  if (isBrowser()) document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
}

function clearDemoCookie(): void {
  if (isBrowser()) document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0`;
}

/** Fire-and-forget write-through; the local cache is already updated. */
function pushToServer(action: () => Promise<unknown>): void {
  if (getMode() !== 'cloud') return;
  void action().catch((error) => {
    console.error('Failed to persist to server; local copy retained.', error);
  });
}

// Lazy import avoids a module cycle (sync.ts → storage.ts → api-client.ts).
async function api() {
  const { apiClient } = await import('@/services/api-client');
  return apiClient;
}

const freshReport = (): ReportCard => ({
  id: 'r1',
  marks: demoMarks,
  createdAt: new Date().toISOString(),
});

/** Called by services/sync.ts after a successful /api/bootstrap. */
export function hydrateFromServer(payload: {
  student: Student | null;
  report: ReportCard | null;
  chat: ChatMessage[];
  plan: StudyPlan | null;
  attempts: MockTestAttempt[];
}): void {
  if (payload.student) write(KEYS.student, payload.student);
  else remove(KEYS.student);
  if (payload.report) write(KEYS.report, payload.report);
  else remove(KEYS.report);
  write(KEYS.chat, payload.chat);
  if (payload.plan) write(KEYS.plan, payload.plan);
  else remove(KEYS.plan);
  write(KEYS.attempts, payload.attempts);
}

/** Clears the cached user data (used on sign-out and reset). */
export function clearLocalData(): void {
  Object.values(KEYS).forEach(remove);
}

export function enterDemoMode(): void {
  setMode('demo');
  setDemoCookie();
}

export function leaveDemoMode(): void {
  clearDemoCookie();
}

export const repo = {
  loadDemo(): void {
    enterDemoMode();
    write(KEYS.student, demoStudent);
    write(KEYS.report, freshReport());
    write(KEYS.chat, demoChat);
  },

  student: () => read<Student | null>(KEYS.student, null),
  saveStudent(student: Student): void {
    write(KEYS.student, student);
    pushToServer(async () => (await api()).saveProfile(student));
  },

  report: () => read<ReportCard>(KEYS.report, freshReport()),
  saveReport(report: ReportCard): void {
    write(KEYS.report, report);
    pushToServer(async () => (await api()).saveReport(report));
  },

  chat: () => read<ChatMessage[]>(KEYS.chat, demoChat),
  saveChat(messages: ChatMessage[]): void {
    write(KEYS.chat, messages);
    pushToServer(async () => (await api()).saveChat(messages));
  },

  plan: () => read<StudyPlan | null>(KEYS.plan, null),
  savePlan(plan: StudyPlan): void {
    write(KEYS.plan, plan);
    pushToServer(async () => (await api()).savePlan(plan));
  },

  attempts: () => read<MockTestAttempt[]>(KEYS.attempts, []),
  saveAttempts(attempts: MockTestAttempt[]): void {
    const previous = read<MockTestAttempt[]>(KEYS.attempts, []);
    write(KEYS.attempts, attempts);
    // Attempts are append-only in the UI; push only the newly added ones.
    const added = attempts.slice(previous.length);
    for (const attempt of added) {
      pushToServer(async () => (await api()).addAttempt(attempt));
    }
  },

  /**
   * Demo mode: restore the seeded demo data (original behavior).
   * Cloud mode: drop the local cache and re-hydrate from the server —
   * never destroys server data.
   */
  reset(): void {
    clearLocalData();
    if (getMode() === 'cloud') {
      void (async () => {
        const { resetSync, ensureSynced } = await import('@/services/sync');
        resetSync();
        await ensureSynced();
      })();
    } else {
      this.loadDemo();
    }
  },
};
