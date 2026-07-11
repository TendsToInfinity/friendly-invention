'use client';

import { PageLoading } from '@/components/loading';
import { Button, Card, Shell } from '@/components/ui';
import { useStudent, useStudyPlan } from '@/hooks/useDemoData';
import { generateStudyPlan } from '@/services/studyPlan';
import { repo } from '@/services/storage';

export default function StudyPlan() {
  const { hydrated, student } = useStudent();
  const { plan, setPlan } = useStudyPlan();
  if (!hydrated) return <PageLoading label="Preparing study plan…" />;

  function regenerate() {
    if (!student) return;
    const nextPlan = generateStudyPlan(student);
    repo.savePlan(nextPlan);
    setPlan(nextPlan);
  }

  function toggleTask(id: string) {
    if (!plan) return;
    const nextPlan = { ...plan, tasks: plan.tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)) };
    repo.savePlan(nextPlan);
    setPlan(nextPlan);
  }

  const progress = plan ? Math.round((plan.tasks.filter((task) => task.completed).length / plan.tasks.length) * 100) : 0;

  return (
    <Shell>
      <main className="mx-auto max-w-5xl p-4">
        <Card>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h1 className="text-3xl font-bold">Personalized Study Plan</h1>
            <Button onClick={regenerate}>Regenerate plan</Button>
          </div>
          <p className="my-3">Progress {progress}% based on weak subjects, available hours, exams, and goals.</p>
          {!plan && <p>No plan yet. Generate one to begin.</p>}
          {plan?.tasks.map((task) => (
            <label key={task.id} className="my-2 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
              <span className="flex-1"><b>{task.day}: {task.title}</b><br /><small>{task.subject} • {task.durationMinutes} min • {task.priority} priority</small></span>
            </label>
          ))}
        </Card>
      </main>
    </Shell>
  );
}
