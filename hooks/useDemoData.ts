'use client';

import { useEffect, useState } from 'react';
import { repo } from '@/services/storage';
import { ensureSynced } from '@/services/sync';
import type { ChatMessage, ReportCard, Student, StudyPlan } from '@/types/models';

/** True once the component has mounted, so localStorage-backed UI can render safely. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/**
 * Loads a value from the repository after mount. Waits for the session sync
 * (services/sync.ts) first, so signed-in users read the server-hydrated
 * cache and signed-out users read demo data — pages can't tell the difference.
 */
function useStoredValue<T>(load: () => T, initial: T) {
  const [hydrated, setHydrated] = useState(false);
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    let cancelled = false;
    void ensureSynced().finally(() => {
      if (cancelled) return;
      setValue(load());
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
    // The loader is a stable repo method; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { hydrated, value, setValue };
}

export function useStudent() {
  const { hydrated, value, setValue } = useStoredValue<Student | null>(() => repo.student(), null);
  return { hydrated, student: value, setStudent: setValue };
}

export function useReport() {
  const { hydrated, value, setValue } = useStoredValue<ReportCard | null>(() => repo.report(), null);
  return { hydrated, report: value, setReport: setValue };
}

export function useChatHistory() {
  const { hydrated, value, setValue } = useStoredValue<ChatMessage[]>(() => repo.chat(), []);
  return { hydrated, messages: value, setMessages: setValue };
}

export function useStudyPlan() {
  const { hydrated, value, setValue } = useStoredValue<StudyPlan | null>(() => repo.plan(), null);
  return { hydrated, plan: value, setPlan: setValue };
}
