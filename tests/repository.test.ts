// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Integration tests against the real test database (see tests/setup.ts).
 * Run `DATABASE_URL=<test-db> npx prisma db push` once before the suite.
 */

// Imported dynamically so tests/setup.ts sets DATABASE_URL first.
const repositoryModule = import('@/server/repository');
const dbModule = import('@/lib/db');

const profileInput = {
  name: 'Priya Test',
  age: 16,
  academic: {
    classGrade: '11',
    board: 'CBSE',
    country: 'India',
    subjects: ['Mathematics', 'Physics'],
    strongSubjects: ['Mathematics'],
    improvementSubjects: ['Physics'],
  },
  interests: ['space'],
  careerInterests: ['Engineering'],
  weeklyStudyHours: 12,
  goal: 'Ace the physics exam',
  notifications: true,
  theme: 'system' as const,
};

describe('server repository', () => {
  let repo: Awaited<typeof repositoryModule>;
  let prisma: Awaited<typeof dbModule>['prisma'];
  let userId: string;

  beforeAll(async () => {
    repo = await repositoryModule;
    ({ prisma } = await dbModule);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    const user = await repo.createUser(`user-${Date.now()}@test.dev`, 'password123');
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('hashes passwords and verifies credentials', async () => {
    const stored = await prisma.user.findUnique({ where: { id: userId } });
    expect(stored?.passwordHash).not.toContain('password123');

    const verified = await repo.verifyUser(stored!.email, 'password123');
    expect(verified?.id).toBe(userId);
    expect(await repo.verifyUser(stored!.email, 'wrong-password')).toBeNull();
  });

  it('upserts and reads a student profile as the domain type', async () => {
    expect(await repo.getStudentProfile(userId)).toBeNull();

    const created = await repo.upsertStudentProfile(userId, profileInput);
    expect(created.name).toBe('Priya Test');
    expect(created.academic.improvementSubjects).toEqual(['Physics']);

    const updated = await repo.upsertStudentProfile(userId, { ...profileInput, age: 17 });
    expect(updated.age).toBe(17);
    expect((await repo.getStudentProfile(userId))?.age).toBe(17);
  });

  it('creates report cards and lists them newest first', async () => {
    await repo.upsertStudentProfile(userId, profileInput);

    const first = await repo.createReportCard(userId, {
      marks: [{ subject: 'Physics', obtained: 70, maximum: 100 }],
    });
    const second = await repo.createReportCard(userId, {
      marks: [{ subject: 'Physics', obtained: 85, maximum: 100 }],
    });

    expect(first).not.toBeNull();
    const latest = await repo.getLatestReportCard(userId);
    expect(latest?.id).toBe(second?.id);
    expect(latest?.marks[0].obtained).toBe(85);
  });

  it('refuses writes before onboarding creates a profile', async () => {
    const result = await repo.createReportCard(userId, {
      marks: [{ subject: 'Physics', obtained: 70, maximum: 100 }],
    });
    expect(result).toBeNull();
  });

  it('replaces chat history preserving order', async () => {
    await repo.upsertStudentProfile(userId, profileInput);
    const now = new Date().toISOString();
    const messages = [
      { id: 'a', role: 'student' as const, content: 'First', createdAt: now },
      { id: 'b', role: 'mentor' as const, content: 'Second', createdAt: now },
      { id: 'c', role: 'student' as const, content: 'Third', createdAt: now },
    ];

    await repo.replaceChatHistory(userId, { messages });
    const stored = await repo.getChatHistory(userId);
    expect(stored.map((m) => m.content)).toEqual(['First', 'Second', 'Third']);

    await repo.replaceChatHistory(userId, { messages: [] });
    expect(await repo.getChatHistory(userId)).toEqual([]);
  });

  it('stores one current study plan per student', async () => {
    await repo.upsertStudentProfile(userId, profileInput);
    const task = {
      id: 't1',
      day: 'Mon',
      title: 'Practice',
      subject: 'Physics',
      durationMinutes: 45,
      priority: 'High' as const,
      completed: false,
    };

    await repo.saveStudyPlan(userId, { id: 'p1', generatedAt: new Date().toISOString(), tasks: [task] });
    await repo.saveStudyPlan(userId, {
      id: 'p2',
      generatedAt: new Date().toISOString(),
      tasks: [{ ...task, completed: true }],
    });

    const plan = await repo.getCurrentStudyPlan(userId);
    expect(plan?.tasks).toHaveLength(1);
    expect(plan?.tasks[0].completed).toBe(true);
    expect(await prisma.studyPlan.count()).toBe(1);
  });

  it('records mock test attempts scoped to the user', async () => {
    await repo.upsertStudentProfile(userId, profileInput);
    await repo.addAttempt(userId, {
      id: 'a1',
      testId: 'local',
      answers: [1, 2, 0],
      score: 2,
      createdAt: new Date().toISOString(),
    });

    const attempts = await repo.listAttempts(userId);
    expect(attempts).toHaveLength(1);
    expect(attempts[0].score).toBe(2);
    expect(attempts[0].answers).toEqual([1, 2, 0]);
  });
});
