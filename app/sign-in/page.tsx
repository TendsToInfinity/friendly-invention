'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Card, Logo, Shell } from '@/components/ui';
import { clearLocalData, leaveDemoMode } from '@/services/storage';
import { resetSync } from '@/services/sync';

/** Only allow same-origin relative callback paths to avoid open redirects. */
function safeCallback(url: string | null): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/dashboard';
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('Invalid email or password.');
      setBusy(false);
      return;
    }
    // Fresh session: drop any demo-mode cache so the next page load hydrates
    // this account's data from the server.
    leaveDemoMode();
    clearLocalData();
    resetSync();
    router.push(safeCallback(params.get('callbackUrl')));
  }

  return (
    <Card>
      <h1 className="text-3xl font-bold">Sign in</h1>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="block">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border p-3"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border p-3"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        No account yet?{' '}
        <Link href="/sign-up" className="font-semibold text-blue-700">Create one</Link>
        {' '}— or head back to the <Link href="/" className="font-semibold text-blue-700">demo</Link>.
      </p>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-md p-4 pt-10">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </main>
    </Shell>
  );
}
