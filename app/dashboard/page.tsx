'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageLoading } from '@/components/loading';
import { ButtonLink, Card, SafetyNote, Shell } from '@/components/ui';
import { useStudent } from '@/hooks/useDemoData';
import { analyzePerformance } from '@/lib/analytics';
import { pct } from '@/lib/utils';
import { recommendCareers } from '@/services/career';
import { repo } from '@/services/storage';

const QUICK_ACTIONS = [
  ['Analyze marks', '/report-card'],
  ['Ask mentor', '/mentor'],
  ['Start mock test', '/mock-test'],
  ['Open study plan', '/study-plan'],
  ['Explore careers', '/career'],
] as const;

export default function Dashboard() {
  const { hydrated, student } = useStudent();

  // Derived data is memoized so localStorage reads and analysis run once
  // per student change instead of on every render.
  const derived = useMemo(() => {
    if (!hydrated || !student) return null;
    const report = repo.report();
    const lastChatMessage = repo.chat().at(-1);
    return {
      insight: analyzePerformance(report.marks),
      topCareer: recommendCareers(student, report.marks)[0],
      chartData: report.marks.map((mark) => ({
        name: mark.subject,
        value: pct(mark.obtained, mark.maximum),
      })),
      lastChatMessage,
    };
  }, [hydrated, student]);

  if (!hydrated) return <PageLoading label="Preparing your dashboard…" />;

  if (!student || !derived) {
    return (
      <Shell>
        <main className="p-8">
          <Card>
            <p>No profile yet.</p>
            <ButtonLink href="/" className="mt-3">Load demo</ButtonLink>
          </Card>
        </main>
      </Shell>
    );
  }

  const { insight, topCareer, chartData, lastChatMessage } = derived;

  return (
    <Shell>
      <main className="mx-auto max-w-7xl space-y-6 p-4">
        <h1 className="text-3xl font-bold">Welcome back, {student.name}</h1>
        <SafetyNote />
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <p>Academic score</p>
            <b className="text-3xl text-blue-600">{insight.overall}%</b>
          </Card>
          <Card>
            <p>Weekly progress</p>
            <b className="text-3xl text-teal">62%</b>
          </Card>
          <Card>
            <p>Learning streak</p>
            <b className="text-3xl text-violet">6 days</b>
          </Card>
          <Card>
            <p>Career fit</p>
            <b>{topCareer?.cluster.name}</b>
            <p className="text-xs">Exploratory guidance</p>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-bold">Performance chart</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h2 className="font-bold">Subjects needing attention</h2>
            <ul className="mt-3 space-y-2">
              {student.academic.improvementSubjects.map((subject) => (
                <li className="rounded-xl bg-blue-50 p-3" key={subject}>
                  Practice {subject} for 45 minutes
                </li>
              ))}
            </ul>
            {lastChatMessage && (
              <p className="mt-3 text-sm text-slate-600">
                Recent AI mentor interaction: {lastChatMessage.content.slice(0, 90)}...
              </p>
            )}
          </Card>
        </div>
        <Card>
          <h2 className="font-bold">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {QUICK_ACTIONS.map(([text, href]) => (
              <ButtonLink key={href} href={href} variant="ghost">{text}</ButtonLink>
            ))}
          </div>
          <p className="mt-4 text-blue-700">Motivational insight: {insight.summary}</p>
        </Card>
      </main>
    </Shell>
  );
}
