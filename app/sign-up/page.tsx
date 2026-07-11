'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Card, Logo, Shell } from '@/components/ui';
import { apiClient } from '@/services/api-client';
import { clearLocalData, leaveDemoMode } from '@/services/storage';
import { resetSync } from '@/services/sync';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);

    const result = await apiClient.signUp(email, password);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    const signedIn = await signIn('credentials', { email, password, redirect: false });
    if (signedIn?.error) {
      setError('Account created — please sign in.');
      setBusy(false);
      router.push('/sign-in');
      return;
    }

    leaveDemoMode();
    clearLocalData();
    resetSync();
    router.push('/onboarding');
  }

  return (
    <Shell>
      <main className="mx-auto max-w-md p-4 pt-10">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <Card>
          <h1 className="text-3xl font-bold">Create your account</h1>
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
              Password (at least 8 characters)
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border p-3"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="block">
              Confirm password
              <input
                type="password"
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border p-3"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-blue-700">Sign in</Link>
          </p>
        </Card>
      </main>
    </Shell>
  );
}
