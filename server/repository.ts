import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import type {
  ChatHistoryInput,
  MockTestAttemptInput,
  ReportCardInput,
  StudentProfileInput,
  StudyPlanInput,
} from '@/lib/validation';
import type { ChatMessage, MockTestAttempt, ReportCard, Student, StudyPlan } from '@/types/models';

/**
 * Server-side repository: the only module that talks to Prisma.
 * Every function takes the authenticated userId and scopes queries to it —
 * authorization lives here, not in the route handlers.
 * Return values are the existing domain types from types/models.ts, so the
 * client cannot tell whether data came from localStorage or PostgreSQL.
 */

const BCRYPT_ROUNDS = 12;

// ---------- users ----------

export async function createUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return prisma.user.create({
    data: { email: email.toLowerCase(), passwordHash },
    select: { id: true, email: true },
  });
}

export async function verifyUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? { id: user.id, email: user.email } : null;
}

export async function emailExists(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return user !== null;
}

// ---------- student profile ----------

type ProfileRow = NonNullable<Awaited<ReturnType<typeof findProfile>>>;

function findProfile(userId: string) {
  return prisma.studentProfile.findUnique({ where: { userId } });
}

function toStudent(row: ProfileRow): Student {
  return {
    id: row.userId,
    name: row.name,
    age: row.age,
    academic: {
      classGrade: row.classGrade,
      board: row.board,
      country: row.country,
      subjects: row.subjects,
      strongSubjects: row.strongSubjects,
      improvementSubjects: row.improvementSubjects,
    },
    interests: row.interests,
    careerInterests: row.careerInterests,
    weeklyStudyHours: row.weeklyStudyHours,
    goal: row.goal,
    notifications: row.notifications,
    theme: row.theme === 'light' ? 'light' : 'system',
  };
}

export async function getStudentProfile(userId: string): Promise<Student | null> {
  const row = await findProfile(userId);
  return row ? toStudent(row) : null;
}

export async function upsertStudentProfile(
  userId: string,
  input: StudentProfileInput,
): Promise<Student> {
  const data = {
    name: input.name,
    age: input.age,
    classGrade: input.academic.classGrade,
    board: input.academic.board,
    country: input.academic.country,
    subjects: input.academic.subjects,
    strongSubjects: input.academic.strongSubjects,
    improvementSubjects: input.academic.improvementSubjects,
    interests: input.interests,
    careerInterests: input.careerInterests,
    weeklyStudyHours: input.weeklyStudyHours,
    goal: input.goal,
    notifications: input.notifications,
    theme: input.theme,
  };
  const row = await prisma.studentProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return toStudent(row);
}

/** Internal: resolves the profile id writes hang off. Null until onboarding completes. */
async function profileIdFor(userId: string): Promise<string | null> {
  const row = await prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
  return row?.id ?? null;
}

// ---------- report cards ----------

type ReportCardRow = { id: string; createdAt: Date; marks: { subject: string; obtained: number; maximum: number }[] };

function toReportCard(row: ReportCardRow): ReportCard {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    marks: row.marks.map((mark) => ({
      subject: mark.subject,
      obtained: mark.obtained,
      maximum: mark.maximum,
    })),
  };
}

export async function createReportCard(
  userId: string,
  input: ReportCardInput,
): Promise<ReportCard | null> {
  const studentId = await profileIdFor(userId);
  if (!studentId) return null;
  const row = await prisma.reportCard.create({
    data: {
      studentId,
      marks: { create: input.marks },
    },
    include: { marks: true },
  });
  return toReportCard(row);
}

export async function listReportCards(userId: string, limit = 10): Promise<ReportCard[]> {
  const studentId = await profileIdFor(userId);
  if (!studentId) return [];
  const rows = await prisma.reportCard.findMany({
    where: { studentId },
    include: { marks: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toReportCard);
}

export async function getLatestReportCard(userId: string): Promise<ReportCard | null> {
  const [latest] = await listReportCards(userId, 1);
  return latest ?? null;
}

// ---------- chat history ----------

export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  const studentId = await profileIdFor(userId);
  if (!studentId) return [];
  const rows = await prisma.chatMessage.findMany({
    where: { studentId },
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map((row) => ({
    id: row.id,
    role: row.role === 'mentor' ? 'mentor' : 'student',
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    subject: row.subject ?? undefined,
  }));
}

/**
 * Replaces the stored history, mirroring the client's saveChat(messages)
 * semantics so the existing UI keeps working unchanged.
 */
export async function replaceChatHistory(
  userId: string,
  input: ChatHistoryInput,
): Promise<boolean> {
  const studentId = await profileIdFor(userId);
  if (!studentId) return false;
  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { studentId } }),
    prisma.chatMessage.createMany({
      data: input.messages.map((message, index) => ({
        studentId,
        role: message.role,
        content: message.content,
        subject: message.subject ?? null,
        createdAt: new Date(message.createdAt),
        sortOrder: index,
      })),
    }),
  ]);
  return true;
}

// ---------- study plans ----------

export async function getCurrentStudyPlan(userId: string): Promise<StudyPlan | null> {
  const studentId = await profileIdFor(userId);
  if (!studentId) return null;
  const row = await prisma.studyPlan.findFirst({
    where: { studentId },
    include: { tasks: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { generatedAt: 'desc' },
  });
  if (!row) return null;
  return {
    id: row.id,
    generatedAt: row.generatedAt.toISOString(),
    tasks: row.tasks.map((task) => ({
      id: task.id,
      day: task.day,
      title: task.title,
      subject: task.subject,
      durationMinutes: task.durationMinutes,
      priority: task.priority as 'High' | 'Medium' | 'Low',
      completed: task.completed,
    })),
  };
}

/**
 * The UI keeps exactly one "current" plan and saves it wholesale (including
 * on every task toggle), so the server stores one plan per student and
 * replaces it transactionally.
 */
export async function saveStudyPlan(userId: string, input: StudyPlanInput): Promise<boolean> {
  const studentId = await profileIdFor(userId);
  if (!studentId) return false;
  await prisma.$transaction([
    prisma.studyPlan.deleteMany({ where: { studentId } }),
    prisma.studyPlan.create({
      data: {
        studentId,
        generatedAt: new Date(input.generatedAt),
        tasks: {
          create: input.tasks.map((task, index) => ({
            day: task.day,
            title: task.title,
            subject: task.subject,
            durationMinutes: task.durationMinutes,
            priority: task.priority,
            completed: task.completed,
            sortOrder: index,
          })),
        },
      },
    }),
  ]);
  return true;
}

// ---------- mock test attempts ----------

export async function listAttempts(userId: string, limit = 50): Promise<MockTestAttempt[]> {
  const studentId = await profileIdFor(userId);
  if (!studentId) return [];
  const rows = await prisma.mockTestAttempt.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    testId: row.testId,
    answers: row.answers as number[],
    score: row.score,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addAttempt(
  userId: string,
  input: MockTestAttemptInput,
): Promise<boolean> {
  const studentId = await profileIdFor(userId);
  if (!studentId) return false;
  await prisma.mockTestAttempt.create({
    data: {
      studentId,
      testId: input.testId,
      answers: input.answers,
      score: input.score,
      createdAt: new Date(input.createdAt),
    },
  });
  return true;
}
