'use client';

import { useEffect, useState } from 'react';
import { PageLoading } from '@/components/loading';
import { Button, Card, Shell } from '@/components/ui';
import { useStudent } from '@/hooks/useDemoData';
import { repo } from '@/services/storage';
import type { Student } from '@/types/models';

export default function Profile() {
  const { hydrated, student } = useStudent();
  const [draft, setDraft] = useState<Student | null>(null);

  useEffect(() => {
    setDraft(student);
  }, [student]);

  if (!hydrated) return <PageLoading label="Loading profile settings…" />;
  if (!draft) return <Shell><main className="p-4"><Card>No profile found.</Card></main></Shell>;

  function save() {
    if (!draft) return;
    repo.saveStudent(draft);
    alert('Profile saved');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ student: draft, report: repo.report(), chat: repo.chat() }, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'mentora-demo-data.json';
    anchor.click();
  }

  return (
    <Shell>
      <main className="mx-auto max-w-3xl p-4">
        <Card>
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <label className="my-3 block">Name<input className="mt-1 w-full rounded-xl border p-3" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label className="my-3 block">Age<input className="mt-1 w-full rounded-xl border p-3" type="number" value={draft.age} onChange={(event) => setDraft({ ...draft, age: Number(event.target.value) })} /></label>
          <label className="my-3 block">Main learning goal<input className="mt-1 w-full rounded-xl border p-3" value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} /></label>
          <label className="my-3 block">Subjects<input className="mt-1 w-full rounded-xl border p-3" value={draft.academic.subjects.join(', ')} onChange={(event) => setDraft({ ...draft, academic: { ...draft.academic, subjects: event.target.value.split(',').map((item) => item.trim()) } })} /></label>
          <label className="flex gap-2"><input type="checkbox" checked={draft.notifications} onChange={(event) => setDraft({ ...draft, notifications: event.target.checked })} /> Study notifications</label>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={save}>Save profile</Button>
            <Button variant="ghost" onClick={exportData}>Export JSON</Button>
            <Button variant="ghost" onClick={() => repo.reset()}>Reset demo data</Button>
            <Button variant="ghost" onClick={() => repo.saveChat([])}>Clear chat history</Button>
          </div>
          <p className="mt-4 text-sm text-slate-600">Privacy notice: this MVP avoids unnecessary data collection and stores demo data locally in your browser.</p>
        </Card>
      </main>
    </Shell>
  );
}
