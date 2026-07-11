import { describe, expect, it } from 'vitest';
import {
  chatHistorySchema,
  credentialsSchema,
  reportCardSchema,
  studentProfileSchema,
  studyPlanSchema,
} from '@/lib/validation';

const validProfile = {
  name: 'Aarav Sharma',
  age: 15,
  academic: {
    classGrade: '10',
    board: 'CBSE',
    country: 'India',
    subjects: ['Mathematics'],
    strongSubjects: ['Mathematics'],
    improvementSubjects: ['Chemistry'],
  },
  interests: ['robotics'],
  careerInterests: ['Engineering'],
  weeklyStudyHours: 14,
  goal: 'Score above 90% in boards',
  notifications: true,
  theme: 'system' as const,
};

describe('credentialsSchema', () => {
  it('accepts a valid email and 8+ char password', () => {
    expect(credentialsSchema.safeParse({ email: 'a@b.co', password: 'password1' }).success).toBe(true);
  });

  it('rejects short passwords and invalid emails', () => {
    expect(credentialsSchema.safeParse({ email: 'a@b.co', password: 'short' }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: 'not-an-email', password: 'password1' }).success).toBe(false);
  });
});

describe('studentProfileSchema', () => {
  it('accepts a valid profile', () => {
    expect(studentProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it('rejects out-of-range age and empty name', () => {
    expect(studentProfileSchema.safeParse({ ...validProfile, age: 5 }).success).toBe(false);
    expect(studentProfileSchema.safeParse({ ...validProfile, name: '' }).success).toBe(false);
  });
});

describe('reportCardSchema', () => {
  it('accepts valid marks', () => {
    const parsed = reportCardSchema.safeParse({
      marks: [{ subject: 'Maths', obtained: 92, maximum: 100 }],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects obtained > maximum — the DB never sees 120% scores', () => {
    const parsed = reportCardSchema.safeParse({
      marks: [{ subject: 'Maths', obtained: 120, maximum: 100 }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects negative and empty payloads', () => {
    expect(reportCardSchema.safeParse({ marks: [] }).success).toBe(false);
    expect(
      reportCardSchema.safeParse({ marks: [{ subject: 'Maths', obtained: -1, maximum: 100 }] }).success,
    ).toBe(false);
  });
});

describe('chatHistorySchema', () => {
  it('accepts valid messages and rejects unknown roles', () => {
    const message = {
      id: 'c1',
      role: 'student',
      content: 'Hi',
      createdAt: new Date().toISOString(),
    };
    expect(chatHistorySchema.safeParse({ messages: [message] }).success).toBe(true);
    expect(
      chatHistorySchema.safeParse({ messages: [{ ...message, role: 'admin' }] }).success,
    ).toBe(false);
  });
});

describe('studyPlanSchema', () => {
  it('round-trips a generated plan shape', () => {
    const plan = {
      id: 'p1',
      generatedAt: new Date().toISOString(),
      tasks: [
        {
          id: 't1',
          day: 'Mon',
          title: 'Focused practice: Chemistry',
          subject: 'Chemistry',
          durationMinutes: 45,
          priority: 'High',
          completed: false,
        },
      ],
    };
    expect(studyPlanSchema.safeParse(plan).success).toBe(true);
    expect(
      studyPlanSchema.safeParse({ ...plan, tasks: [{ ...plan.tasks[0], priority: 'Urgent' }] }).success,
    ).toBe(false);
  });
});
