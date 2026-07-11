'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { clearLocalData, getMode, setMode as setStorageMode } from '@/services/storage';
import { ensureSynced, resetSync } from '@/services/sync';

/**
 * Small nav control: "Sign in" for demo/anonymous visitors, "Sign out" for
 * authenticated users. Sign-out clears the local cache so no student data
 * lingers on shared computers.
 */
export function AuthStatus() {
  const [mode, setMode] = useState<'loading' | 'demo' | 'cloud'>('loading');
  const router = useRouter();

  useEffect(() => {
    void ensureSynced().then(() => setMode(getMode()));
  }, []);

  if (mode === 'loading') return null;

  if (mode === 'cloud') {
    return (
      <button
        className="focus-ring rounded-xl px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        onClick={async () => {
          await signOut({ redirect: false });
          clearLocalData();
          setStorageMode('demo');
          resetSync();
          router.push('/');
        }}
      >
        Sign out
      </button>
    );
  }

  return (
    <Link href="/sign-in" className="text-sm font-semibold text-slate-700">
      Sign in
    </Link>
  );
}
