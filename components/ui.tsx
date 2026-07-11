import Link from 'next/link';
import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
        <Sparkles size={16} />
        <BookOpen size={16} />
      </span>
      <span>Mentora AI</span>
    </Link>
  );
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'focus-ring rounded-xl px-4 py-2 font-semibold transition disabled:opacity-50',
        variant === 'ghost' ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-blue-600 text-white shadow-soft hover:bg-blue-700',
        className,
      )}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('rounded-2xl border border-blue-100 bg-white p-5 shadow-soft', className)} />;
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="sticky top-0 z-20 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <Logo />
          <div className="hidden gap-4 text-sm md:flex">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/report-card">Report Card</Link>
            <Link href="/mentor">AI Mentor</Link>
            <Link href="/mock-test">Mock Test</Link>
            <Link href="/study-plan">Study Plan</Link>
            <Link href="/career">Career</Link>
            <Link href="/profile">Profile</Link>
          </div>
          <Link href="/dashboard" className="md:hidden" aria-label="Open dashboard">
            <TrendingUp />
          </Link>
        </div>
      </nav>
      {children}
      <footer className="mt-12 border-t bg-white p-6 text-center text-sm text-slate-600">
        Privacy: demo data stays in your browser local storage. AI guidance should be reviewed with parents, teachers, or qualified counselors.
      </footer>
    </div>
  );
}

export function SafetyNote() {
  return (
    <p className="rounded-xl bg-teal-50 p-3 text-sm text-teal-900">
      Mentora AI provides supportive educational guidance, not final decisions. Review important academic, wellbeing, and career choices with parents, teachers, or qualified counselors.
    </p>
  );
}
