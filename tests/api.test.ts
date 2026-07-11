// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * API route-handler tests: real repository + real test database, with the
 * Auth.js session mocked so each request can impersonate a specific user.
 */

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock('@/auth', () => ({ auth: authMock }));

const asUser = (id: string | null) =>
  authMock.mockResolvedValue(id ? { user: { id } } : null);

const jsonRequest = (body: unknown) =>
  new Request('http://localhost/api/test', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('API route handlers', () => {
  let prisma: (typeof import('@/lib/db'))['prisma'];
  let repo: typeof import('@/server/repository');
  let profileRoute: typeof import('@/app/api/profile/route');
  let chatRoute: typeof import('@/app/api/chat/route');
  let bootstrapRoute: typeof import('@/app/api/bootstrap/route');
  let userId: string;

  const profilePayload = {
    name: 'Priya Test',
    age: 16,
    academic: {
      classGrade: '11',
      board: 'CBSE',
      country: 'India',
      subjects: ['Physics'],
      strongSubjects: ['Physics'],
      improvementSubjects: ['Chemistry'],
    },
    interests: ['space'],
    careerInterests: ['Engineering'],
    weeklyStudyHours: 12,
    goal: 'Ace the exam',
    notifications: true,
    theme: 'system',
  };

  beforeAll(async () => {
    ({ prisma } = await import('@/lib/db'));
    repo = await import('@/server/repository');
    profileRoute = await import('@/app/api/profile/route');
    chatRoute = await import('@/app/api/chat/route');
    bootstrapRoute = await import('@/app/api/bootstrap/route');
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    const user = await repo.createUser(`api-${Date.now()}@test.dev`, 'password123');
    userId = user.id;
    authMock.mockReset();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('rejects unauthenticated requests with 401', async () => {
    asUser(null);
    expect((await profileRoute.GET()).status).toBe(401);
    expect((await chatRoute.GET()).status).toBe(401);
    expect((await bootstrapRoute.GET()).status).toBe(401);
    expect((await profileRoute.PUT(jsonRequest(profilePayload))).status).toBe(401);
  });

  it('saves and returns the profile for the session user', async () => {
    asUser(userId);

    const putResponse = await profileRoute.PUT(jsonRequest(profilePayload));
    expect(putResponse.status).toBe(200);

    const getResponse = await profileRoute.GET();
    const body = (await getResponse.json()) as { student: { name: string; id: string } };
    expect(body.student.name).toBe('Priya Test');
    expect(body.student.id).toBe(userId);
  });

  it('rejects invalid profile payloads with 400', async () => {
    asUser(userId);
    const response = await profileRoute.PUT(jsonRequest({ ...profilePayload, age: 3 }));
    expect(response.status).toBe(400);
  });

  it('requires onboarding before chat writes (409)', async () => {
    asUser(userId);
    const response = await chatRoute.PUT(
      jsonRequest({
        messages: [
          { id: 'm1', role: 'student', content: 'Hi', createdAt: new Date().toISOString() },
        ],
      }),
    );
    expect(response.status).toBe(409);
  });

  it('scopes data to the session user, not request contents', async () => {
    // User A saves a profile and chat history.
    asUser(userId);
    await profileRoute.PUT(jsonRequest(profilePayload));
    await chatRoute.PUT(
      jsonRequest({
        messages: [
          { id: 'm1', role: 'student', content: 'private note', createdAt: new Date().toISOString() },
        ],
      }),
    );

    // User B sees nothing of user A's data.
    const other = await repo.createUser(`other-${Date.now()}@test.dev`, 'password123');
    asUser(other.id);
    const bootstrap = await bootstrapRoute.GET();
    const body = (await bootstrap.json()) as { student: unknown; chat: unknown[] };
    expect(body.student).toBeNull();
    expect(body.chat).toEqual([]);
  });

  it('returns the full bootstrap payload after onboarding', async () => {
    asUser(userId);
    await profileRoute.PUT(jsonRequest(profilePayload));

    const response = await bootstrapRoute.GET();
    const body = (await response.json()) as {
      student: { name: string };
      report: unknown;
      chat: unknown[];
      plan: unknown;
      attempts: unknown[];
    };
    expect(body.student.name).toBe('Priya Test');
    expect(body.report).toBeNull();
    expect(body.chat).toEqual([]);
    expect(body.plan).toBeNull();
    expect(body.attempts).toEqual([]);
  });
});
