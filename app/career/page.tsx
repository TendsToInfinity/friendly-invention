'use client';

import { PageLoading } from '@/components/loading';
import { Card, SafetyNote, Shell } from '@/components/ui';
import { useStudent } from '@/hooks/useDemoData';
import { recommendCareers } from '@/services/career';
import { repo } from '@/services/storage';

export default function Career() {
  const { hydrated, student } = useStudent();
  if (!hydrated) return <PageLoading label="Preparing career explorer…" />;
  const recommendations = student ? recommendCareers(student, repo.report().marks) : [];

  return (
    <Shell>
      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <h1 className="text-3xl font-bold">Career Explorer</h1>
        <SafetyNote />
        <p>These are career clusters for exploration, never instructions about what a student must choose.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((recommendation) => (
            <Card key={recommendation.cluster.id}>
              <div className="flex justify-between gap-3">
                <h2 className="text-xl font-bold">{recommendation.cluster.name}</h2>
                <b className="text-blue-600">{recommendation.matchScore}% match</b>
              </div>
              <p>{recommendation.cluster.description}</p>
              <p className="mt-2"><b>Why it may suit you:</b> {recommendation.why}</p>
              <p><b>Relevant subjects:</b> {recommendation.cluster.subjects.join(', ')}</p>
              <p><b>Skills to develop:</b> {recommendation.cluster.skills.join(', ')}</p>
              <ul className="mt-2 list-disc pl-5">
                {recommendation.nextSteps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </main>
    </Shell>
  );
}
