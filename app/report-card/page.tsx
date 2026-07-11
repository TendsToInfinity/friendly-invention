'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageLoading } from '@/components/loading';
import { Button, Card, Shell } from '@/components/ui';
import { useReport } from '@/hooks/useDemoData';
import { analyzePerformance } from '@/lib/analytics';
import { ocrProvider } from '@/services/ocr';
import { repo } from '@/services/storage';
import type { SubjectMark } from '@/types/models';

export default function Report() {
  const { hydrated, report } = useReport();
  const [marks, setMarks] = useState<SubjectMark[]>([]);
  const [file, setFile] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (report) setMarks(report.marks);
  }, [report]);

  if (!hydrated) return <PageLoading label="Loading report-card tools…" />;

  const insight = analyzePerformance(marks);

  async function upload(fileToProcess: File) {
    setFile(fileToProcess.name);
    setBusy(true);
    const extractedMarks = await ocrProvider.extract(fileToProcess);
    setMarks(extractedMarks);
    setBusy(false);
  }

  function save() {
    repo.saveReport({ id: 'r1', marks, createdAt: new Date().toISOString() });
  }

  return (
    <Shell>
      <main className="mx-auto max-w-7xl space-y-5 p-4">
        <h1 className="text-3xl font-bold">Report Card Analysis</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="font-bold">Upload mode</h2>
            <input aria-label="Upload report card" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} className="mt-3 w-full rounded-xl border border-dashed p-8" />
            <p>{busy ? 'Simulating OCR processing...' : file && `Processed ${file}`}</p>
          </Card>
          <Card>
            <h2 className="font-bold">Manual mode</h2>
            {marks.map((mark, index) => (
              <div className="my-2 grid grid-cols-1 gap-2 sm:grid-cols-4" key={`${mark.subject}-${index}`}>
                <input aria-label="Subject" className="rounded border p-2" value={mark.subject} onChange={(event) => setMarks(marks.map((item, itemIndex) => (itemIndex === index ? { ...item, subject: event.target.value } : item)))} />
                <input aria-label="Obtained marks" className="rounded border p-2" type="number" value={mark.obtained} onChange={(event) => setMarks(marks.map((item, itemIndex) => (itemIndex === index ? { ...item, obtained: Number(event.target.value) } : item)))} />
                <input aria-label="Maximum marks" className="rounded border p-2" type="number" value={mark.maximum} onChange={(event) => setMarks(marks.map((item, itemIndex) => (itemIndex === index ? { ...item, maximum: Number(event.target.value) } : item)))} />
                <Button variant="ghost" onClick={() => setMarks(marks.filter((_, itemIndex) => itemIndex !== index))}>Delete</Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setMarks([...marks, { subject: 'New subject', obtained: 0, maximum: 100 }])}>Add subject</Button>
              <Button onClick={save}>Save analysis</Button>
            </div>
          </Card>
        </div>
        <Card>
          <h2 className="text-xl font-bold">Overall {insight.overall}%</h2>
          <p>Strongest: {insight.strongest.join(', ')}. Improve with kindness: {insight.improvement.join(', ')}.</p>
          <ResponsiveContainer height={260}>
            <BarChart data={marks.map((mark) => ({ name: mark.subject, value: Math.round((mark.obtained / mark.maximum) * 100) }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#14b8a6" radius={8} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-blue-700">AI summary: {insight.summary} Recommendations: revise weak concepts, solve small daily sets, and review mistakes without self-criticism.</p>
        </Card>
      </main>
    </Shell>
  );
}
