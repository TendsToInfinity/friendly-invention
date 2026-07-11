import { Card, Shell } from '@/components/ui';

export function PageLoading({ label = 'Loading Mentora AI…' }: { label?: string }) {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl p-4">
        <Card className="animate-pulse">
          <div className="h-5 w-44 rounded bg-blue-100" />
          <div className="mt-4 h-24 rounded-2xl bg-slate-100" />
          <p className="mt-4 text-sm text-slate-600">{label}</p>
        </Card>
      </main>
    </Shell>
  );
}
