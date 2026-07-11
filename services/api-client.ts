import type { ChatMessage, MockTestAttempt, ReportCard, Student, StudyPlan } from '@/types/models';

/**
 * Thin fetch wrappers over the Phase 1 API. All endpoints are same-origin
 * route handlers; the session travels in the auth cookie automatically.
 */

export type BootstrapPayload = {
  student: Student | null;
  report: ReportCard | null;
  chat: ChatMessage[];
  plan: StudyPlan | null;
  attempts: MockTestAttempt[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/** Student → profile payload (the id lives in the session, not the body). */
function toProfilePayload(student: Student) {
  return {
    name: student.name,
    age: student.age,
    academic: student.academic,
    interests: student.interests,
    careerInterests: student.careerInterests,
    weeklyStudyHours: student.weeklyStudyHours,
    goal: student.goal,
    notifications: student.notifications,
    theme: student.theme,
  };
}

export const apiClient = {
  /** Returns null when signed out (401) — the caller falls back to demo mode. */
  async bootstrap(): Promise<BootstrapPayload | null> {
    const response = await fetch('/api/bootstrap');
    if (response.status === 401) return null;
    if (!response.ok) throw new Error(`Bootstrap failed with ${response.status}`);
    return response.json() as Promise<BootstrapPayload>;
  },

  saveProfile: (student: Student) =>
    request('/api/profile', { method: 'PUT', body: JSON.stringify(toProfilePayload(student)) }),

  saveReport: (report: ReportCard) =>
    request('/api/report-cards', { method: 'POST', body: JSON.stringify({ marks: report.marks }) }),

  saveChat: (messages: ChatMessage[]) =>
    request('/api/chat', { method: 'PUT', body: JSON.stringify({ messages }) }),

  savePlan: (plan: StudyPlan) =>
    request('/api/study-plan', { method: 'PUT', body: JSON.stringify(plan) }),

  addAttempt: (attempt: MockTestAttempt) =>
    request('/api/attempts', { method: 'POST', body: JSON.stringify(attempt) }),

  async signUp(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) return { ok: true };
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? 'Sign up failed. Please try again.' };
  },
};
