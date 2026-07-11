'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageLoading } from '@/components/loading';
import { Button, Card, Shell } from '@/components/ui';
import { useReport } from '@/hooks/useDemoData';
import { analyzePerformance } from '@/lib/analytics';
import { pct } from '@/lib/utils';
import { ocrProvider } from '@/services/ocr';
import { repo } from '@/services/storage';
import type { SubjectMark } from '@/types/models';

export default function Report() {
  const { hydrated, report } = useReport();
  const [marks, setMarks] = useState<SubjectMark[]>([]);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (report) setMarks(report.marks);
  }, [report]);

  const insight = useMemo(() => analyzePerformance(marks), [marks]);
  const chartData = useMemo(
    () => marks.map((mark) => ({ name: mark.subject, value: pct(mark.obtained, mark.maximum) })),
    [marks],
  );

  if (!hydrated) return <PageLoading label="Loading report-card tools…" />;

  async function upload(fileToProcess: File) {
    setFileName(fileToProcess.name);
    setBusy(true);
    try {
      const extractedMarks = await ocrProvider.extract(fileToProcess);
      setMarks(extractedMarks);
    } finally {
      setBusy(false);
    }
  }

  function updateMark(index: number, patch: Partial<SubjectMark>) {
    setMarks((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
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
            <input
              aria-label="Upload report card"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])}
              className="mt-3 w-full rounded-xl border border-dashed p-8"
            />
            <p>{busy ? 'Simulating OCR processing...' : fileName && `Processed ${fileName}`}</p>
          </Card>
          <Card>
            <h2 className="font-bold">Manual mode</h2>
            {marks.map((mark, index) => (
              <div className="my-2 grid grid-cols-1 gap-2 sm:grid-cols-4" key={`${mark.subject}-${index}`}>
                <input
                  aria-label="Subject"
                  className="rounded border p-2"
                  value={mark.subject}
                  onChange={(event) => updateMark(index, { subject: event.target.value })}
                />
                <input
                  aria-label="Obtained marks"
                  className="rounded border p-2"
                  type="number"
                  value={mark.obtained}
                  onChange={(event) => updateMark(index, { obtained: Number(event.target.value) })}
                />
                <input
                  aria-label="Maximum marks"
                  className="rounded border p-2"
                  type="number"
                  value={mark.maximum}
                  onChange={(event) => updateMark(index, { maximum: Number(event.target.value) })}
                />
                <Button variant="ghost" onClick={() => setMarks(marks.filter((_, itemIndex) => itemIndex !== index))}>
                  Delete
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setMarks([...marks, { subject: 'New subject', obtained: 0, maximum: 100 }])}>
                Add subject
              </Button>
              <Button onClick={save}>Save analysis</Button>
            </div>
          </Card>
        </div>
        <Card>
          <h2 className="text-xl font-bold">Overall {insight.overall}%</h2>
          <p>
            Strongest: {insight.strongest.join(', ')}. Improve with kindness: {insight.improvement.join(', ')}.
          </p>
          <ResponsiveContainer height={260}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#14b8a6" radius={8} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-blue-700">
            AI summary: {insight.summary} Recommendations: revise weak concepts, solve small daily sets, and review
            mistakes without self-criticism.
          </p>
        </Card>
      </main>
    </Shell>
  );
}
