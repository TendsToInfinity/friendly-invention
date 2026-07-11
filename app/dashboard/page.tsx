'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Compass, Target, Trophy } from 'lucide-react';
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

/** Animated count-up for stat tiles; jumps straight to the target under reduced motion. */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

function StatTile({
  label,
  value,
  suffix = '',
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  icon: typeof Trophy;
  tone: string;
}) {
  const animated = useCountUp(value);
  return (
    <Card className={`animate-pop bg-gradient-to-br ${tone} text-white`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white/90">{label}</p>
        <span className="icon-bubble grid h-10 w-10 place-items-center rounded-xl bg-white/20">
          <Icon size={20} />
        </span>
      </div>
      <b className="text-3xl">{animated}{suffix}</b>
      <p className="text-xs text-white/80">{hint}</p>
    </Card>
  );
}

export default function Dashboard() {
  const { hydrated, student } = useStudent();

  // Derived data is memoized so localStorage reads and analysis run once
  // per student change instead of on every render.
  const derived = useMemo(() => {
    if (!hydrated || !student) return null;
    const report = repo.report();
    const plan = repo.plan();
    const attempts = repo.attempts();
    const lastChatMessage = repo.chat().at(-1);
    const planProgress = plan?.tasks.length
      ? Math.round((plan.tasks.filter((task) => task.completed).length / plan.tasks.length) * 100)
      : 0;
    return {
      insight: analyzePerformance(report.marks),
      topCareer: recommendCareers(student, report.marks)[0],
      chartData: report.marks.map((mark) => ({
        name: mark.subject,
        value: pct(mark.obtained, mark.maximum),
      })),
      lastChatMessage,
      planProgress,
      hasPlan: Boolean(plan?.tasks.length),
      attemptCount: attempts.length,
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

  const { insight, topCareer, chartData, lastChatMessage, planProgress, hasPlan, attemptCount } = derived;

  return (
    <Shell>
      <main className="mx-auto max-w-7xl space-y-6 p-4">
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-text">{student.name}</span> 👋
        </h1>
        <SafetyNote />
        <div className="grid gap-4 md:grid-cols-4">
          <StatTile
            label="Academic score"
            value={insight.overall}
            suffix="%"
            hint="from your latest report card"
            icon={Trophy}
            tone="from-blue-600 to-blue-500"
          />
          <StatTile
            label="Weekly progress"
            value={planProgress}
            suffix="%"
            hint={hasPlan ? 'study-plan tasks completed' : 'generate a plan to start tracking'}
            icon={CalendarCheck}
            tone="from-teal to-emerald-500"
          />
          <StatTile
            label="Tests taken"
            value={attemptCount}
            hint={attemptCount ? 'keep the streak going!' : 'try your first mock test'}
            icon={Target}
            tone="from-violet to-purple-500"
          />
          <Card className="animate-pop">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Career fit</p>
              <span className="icon-bubble grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                <Compass size={20} />
              </span>
            </div>
            <b>{topCareer?.cluster.name}</b>
            <p className="text-xs text-slate-500">Exploratory guidance</p>
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
                <li className="rounded-xl bg-blue-50 p-3 transition hover:bg-blue-100" key={subject}>
                  💪 Practice {subject} for 45 minutes
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
