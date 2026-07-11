'use client';

import { useRouter } from 'next/navigation';
import { BarChart, Brain, CheckCircle2, Compass, MessageCircle, Upload } from 'lucide-react';
import { Button, ButtonLink, Card, Logo, SafetyNote } from '@/components/ui';
import { repo } from '@/services/storage';

const features = [
  [Brain, 'AI mentor chat'],
  [Upload, 'Report card analysis'],
  [BarChart, 'Performance charts'],
  [CheckCircle2, 'Weekly study plan'],
  [MessageCircle, 'Mock tests'],
  [Compass, 'Career exploration'],
] as const;

export default function Landing() {
  const router = useRouter();
  const loadDemo = () => {
    repo.loadDemo();
    router.push('/dashboard');
  };

  return (
    <main>
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <Logo />
        <div className="flex gap-2">
          <ButtonLink href="/sign-in" variant="ghost">Sign In</ButtonLink>
          <ButtonLink href="/onboarding" variant="ghost">Onboard</ButtonLink>
          <Button onClick={loadDemo}>Load Demo Account</Button>
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-2">
        <div className="space-y-6">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">Progressive web app MVP</span>
          <h1 className="text-5xl font-bold tracking-tight text-slate-950">Your Personal AI Student Mentor</h1>
          <p className="text-lg text-slate-600">Mentora AI helps students understand performance, practice with mock tests, plan weekly study, chat with a mentor, and explore careers responsibly.</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/onboarding">Start Your Journey</ButtonLink>
            <Button onClick={loadDemo} variant="ghost">Try Aarav’s demo</Button>
          </div>
          <SafetyNote />
        </div>
        <Card className="animate-in">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-teal-50 p-5">
            <h2 className="text-xl font-bold">Today’s mentor snapshot</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-white p-4 shadow-sm">Overall score <b className="float-right text-blue-600">85%</b></div>
              <div className="rounded-xl bg-white p-4 shadow-sm">Focus area <b className="float-right text-violet">Chemistry</b></div>
              <div className="rounded-xl bg-white p-4 shadow-sm">Next task <b className="float-right text-teal">45 min revision</b></div>
            </div>
          </div>
        </Card>
      </section>
      <section className="mx-auto max-w-7xl px-4">
        <h2 className="text-3xl font-bold">Features</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map(([Icon, title]) => (
            <Card key={title}>
              <Icon className="text-blue-600" />
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="text-sm text-slate-600">Interactive, supportive, and locally runnable with mock services.</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:grid-cols-3">
        <Card><b>1. Create profile</b><p>Enter class, board, interests, goals, and subjects.</p></Card>
        <Card><b>2. Analyze & practice</b><p>Add marks, chat, generate tests, and review explanations.</p></Card>
        <Card><b>3. Plan & explore</b><p>Follow weekly tasks and explore career clusters safely.</p></Card>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <Card className="text-center">
          <h2 className="text-3xl font-bold">Ready to mentor smarter?</h2>
          <p className="my-3 text-slate-600">For students, parents, schools, and partners evaluating student-first AI.</p>
          <Button onClick={loadDemo}>Start with demo account</Button>
        </Card>
      </section>
    </main>
  );
}
