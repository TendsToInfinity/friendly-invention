import { demoChat, demoMarks, demoStudent } from '@/data/demo';
import type { ChatMessage, MockTestAttempt, ReportCard, Student, StudyPlan } from '@/types/models';

/**
 * Local-storage backed repository for the MVP.
 * Persistence stays behind this interface so a real backend
 * (API + PostgreSQL) can replace it without touching UI code.
 */

const KEYS = {
  student: 'student',
  report: 'report',
  chat: 'chat',
  plan: 'plan',
  attempts: 'attempts',
} as const;

const isBrowser = () => typeof window !== 'undefined';

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or blocked (private mode); the app keeps working in memory.
  }
}

const freshReport = (): ReportCard => ({
  id: 'r1',
  marks: demoMarks,
  createdAt: new Date().toISOString(),
});

export const repo = {
  loadDemo(): void {
    write(KEYS.student, demoStudent);
    write(KEYS.report, freshReport());
    write(KEYS.chat, demoChat);
  },

  student: () => read<Student | null>(KEYS.student, null),
  saveStudent: (student: Student) => write(KEYS.student, student),

  report: () => read<ReportCard>(KEYS.report, freshReport()),
  saveReport: (report: ReportCard) => write(KEYS.report, report),

  chat: () => read<ChatMessage[]>(KEYS.chat, demoChat),
  saveChat: (messages: ChatMessage[]) => write(KEYS.chat, messages),

  plan: () => read<StudyPlan | null>(KEYS.plan, null),
  savePlan: (plan: StudyPlan) => write(KEYS.plan, plan),

  attempts: () => read<MockTestAttempt[]>(KEYS.attempts, []),
  saveAttempts: (attempts: MockTestAttempt[]) => write(KEYS.attempts, attempts),

  /** Clears only Mentora's own keys — never other data the origin may hold. */
  reset(): void {
    if (isBrowser()) {
      Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    }
    this.loadDemo();
  },
};
