'use client';

import { useRouter } from 'next/navigation';
import { BarChart, Brain, CheckCircle2, Compass, MessageCircle, Upload } from 'lucide-react';
import { Mascot } from '@/components/mascot';
import { Button, ButtonLink, Card, Logo, SafetyNote } from '@/components/ui';
import { repo } from '@/services/storage';

const features = [
  [Brain, 'AI mentor chat', 'Ask anything — Mo explains, quizzes, and cheers you on.', 'bg-blue-100 text-blue-600'],
  [Upload, 'Report card analysis', 'Add your marks and instantly see where you shine.', 'bg-teal-50 text-teal'],
  [BarChart, 'Performance charts', 'Colorful charts that make progress feel like a game.', 'bg-violet/10 text-violet'],
  [CheckCircle2, 'Weekly study plan', 'Small daily wins, tracked with satisfying checkboxes.', 'bg-amber-100 text-amber-600'],
  [MessageCircle, 'Mock tests', 'Quick quizzes with confetti when you crush them. 🎉', 'bg-rose-100 text-rose-500'],
  [Compass, 'Career exploration', 'Discover where your strengths could take you.', 'bg-emerald-100 text-emerald-600'],
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
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            Learning that feels like play ✨
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-slate-950">
            Your Personal <span className="gradient-text">AI Student Mentor</span>
          </h1>
          <p className="text-lg text-slate-600">
            Mentora AI helps students understand performance, practice with mock tests, plan weekly study, chat with a mentor, and explore careers responsibly.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/onboarding">Start Your Journey</ButtonLink>
            <Button onClick={loadDemo} variant="ghost">Try Aarav’s demo</Button>
          </div>
          <SafetyNote />
        </div>
        <Card className="animate-in">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-teal-50 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Today’s mentor snapshot</h2>
              <Mascot size={72} className="animate-float" />
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                Overall score <b className="float-right text-blue-600">85%</b>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                Focus area <b className="float-right text-violet">Chemistry</b>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                Next task <b className="float-right text-teal">45 min revision</b>
              </div>
            </div>
          </div>
        </Card>
      </section>
      <section className="mx-auto max-w-7xl px-4">
        <h2 className="text-3xl font-bold">Features</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map(([Icon, title, blurb, bubble]) => (
            <Card key={title}>
              <span className={`icon-bubble grid h-12 w-12 place-items-center rounded-2xl ${bubble}`}>
                <Icon />
              </span>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="text-sm text-slate-600">{blurb}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:grid-cols-3">
        <Card>
          <span className="text-2xl">🧑‍🎓</span>
          <b className="block">1. Create profile</b>
          <p>Enter class, board, interests, goals, and subjects.</p>
        </Card>
        <Card>
          <span className="text-2xl">📈</span>
          <b className="block">2. Analyze & practice</b>
          <p>Add marks, chat, generate tests, and review explanations.</p>
        </Card>
        <Card>
          <span className="text-2xl">🚀</span>
          <b className="block">3. Plan & explore</b>
          <p>Follow weekly tasks and explore career clusters safely.</p>
        </Card>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <Card className="text-center">
          <div className="flex justify-center"><Mascot size={80} className="animate-float" /></div>
          <h2 className="text-3xl font-bold">Ready to mentor smarter?</h2>
          <p className="my-3 text-slate-600">For students, parents, schools, and partners evaluating student-first AI.</p>
          <Button onClick={loadDemo}>Start with demo account</Button>
        </Card>
      </section>
    </main>
  );
}
