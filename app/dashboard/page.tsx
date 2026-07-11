'use client';

import Link from 'next/link';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageLoading } from '@/components/loading';
import { Button, Card, SafetyNote, Shell } from '@/components/ui';
import { analyzePerformance } from '@/lib/analytics';
import { recommendCareers } from '@/services/career';
import { repo } from '@/services/storage';
import { useStudent } from '@/hooks/useDemoData';

export default function Dashboard() {
  const { hydrated, student } = useStudent();

  if (!hydrated) return <PageLoading label="Preparing your dashboard…" />;

  if (!student) {
    return (
      <Shell>
        <main className="p-8">
          <Card>
            <p>No profile yet.</p>
            <Link href="/">
              <Button>Load demo</Button>
            </Link>
          </Card>
        </main>
      </Shell>
    );
  }

  const report = repo.report();
  const insight = analyzePerformance(report.marks);
  const careers = recommendCareers(student, report.marks);

  return (
    <Shell>
      <main className="mx-auto max-w-7xl space-y-6 p-4">
        <h1 className="text-3xl font-bold">Welcome back, {student.name}</h1>
        <SafetyNote />
        <div className="grid gap-4 md:grid-cols-4">
          <Card><p>Academic score</p><b className="text-3xl text-blue-600">{insight.overall}%</b></Card>
          <Card><p>Weekly progress</p><b className="text-3xl text-teal">62%</b></Card>
          <Card><p>Learning streak</p><b className="text-3xl text-violet">6 days</b></Card>
          <Card><p>Career fit</p><b>{careers[0]?.cluster.name}</b><p className="text-xs">Exploratory guidance</p></Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-bold">Performance chart</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={report.marks.map((mark) => ({ name: mark.subject, value: Math.round((mark.obtained / mark.maximum) * 100) }))}>
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
                <li className="rounded-xl bg-blue-50 p-3" key={subject}>Practice {subject} for 45 minutes</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600">Recent AI mentor interaction: {repo.chat().at(-1)?.content.slice(0, 90)}...</p>
          </Card>
        </div>
        <Card>
          <h2 className="font-bold">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              ['Analyze marks', '/report-card'],
              ['Ask mentor', '/mentor'],
              ['Start mock test', '/mock-test'],
              ['Open study plan', '/study-plan'],
              ['Explore careers', '/career'],
            ].map(([text, href]) => (
              <Link key={text} href={href}><Button variant="ghost">{text}</Button></Link>
            ))}
          </div>
          <p className="mt-4 text-blue-700">Motivational insight: {insight.summary}</p>
        </Card>
      </main>
    </Shell>
  );
}
