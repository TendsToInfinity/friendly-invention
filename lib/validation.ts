import { z } from 'zod';

/**
 * Shared Zod schemas for every API write path. These are the single source
 * of truth for what the server accepts; the client reuses them so demo mode
 * and cloud mode validate identically.
 */

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export const subjectMarkSchema = z
  .object({
    subject: z.string().trim().min(1).max(80),
    obtained: z.number().min(0).max(1000),
    maximum: z.number().positive().max(1000),
  })
  .refine((mark) => mark.obtained <= mark.maximum, {
    message: 'Obtained marks cannot exceed maximum marks',
    path: ['obtained'],
  });

export const reportCardSchema = z.object({
  marks: z.array(subjectMarkSchema).min(1).max(30),
});

export const studentProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.number().int().min(8).max(100),
  academic: z.object({
    classGrade: z.string().trim().min(1).max(20),
    board: z.string().trim().min(1).max(50),
    country: z.string().trim().min(1).max(60),
    subjects: z.array(z.string().trim().min(1).max(60)).max(20),
    strongSubjects: z.array(z.string().trim().min(1).max(60)).max(20),
    improvementSubjects: z.array(z.string().trim().min(1).max(60)).max(20),
  }),
  interests: z.array(z.string().trim().min(1).max(60)).max(20),
  careerInterests: z.array(z.string().trim().min(1).max(60)).max(20),
  weeklyStudyHours: z.number().int().min(1).max(100),
  goal: z.string().trim().min(1).max(300),
  notifications: z.boolean(),
  theme: z.enum(['light', 'system']),
});

export const chatMessageSchema = z.object({
  id: z.string().min(1).max(64),
  role: z.enum(['student', 'mentor']),
  content: z.string().min(1).max(8000),
  createdAt: z.string().datetime(),
  subject: z.string().max(60).optional(),
});

export const chatHistorySchema = z.object({
  messages: z.array(chatMessageSchema).max(500),
});

export const studyTaskSchema = z.object({
  id: z.string().min(1).max(64),
  day: z.string().min(1).max(12),
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(60),
  durationMinutes: z.number().int().min(1).max(600),
  priority: z.enum(['High', 'Medium', 'Low']),
  completed: z.boolean(),
});

export const studyPlanSchema = z.object({
  id: z.string().min(1).max(64),
  generatedAt: z.string().datetime(),
  tasks: z.array(studyTaskSchema).max(100),
});

export const mentorRequestSchema = z.object({
  subject: z.string().trim().min(1).max(60),
  messages: z.array(chatMessageSchema).min(1).max(50),
});

export const mockTestAttemptSchema = z.object({
  id: z.string().min(1).max(64),
  testId: z.string().min(1).max(64),
  answers: z.array(z.number().int().min(-1).max(10)).max(100),
  score: z.number().int().min(0).max(100),
  createdAt: z.string().datetime(),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type ReportCardInput = z.infer<typeof reportCardSchema>;
export type ChatHistoryInput = z.infer<typeof chatHistorySchema>;
export type StudyPlanInput = z.infer<typeof studyPlanSchema>;
export type MockTestAttemptInput = z.infer<typeof mockTestAttemptSchema>;
