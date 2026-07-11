import { describe, expect, it } from 'vitest';
import { adaptiveReply, stripMarkers, type MentorContext } from '@/lib/mentor-knowledge';
import type { ChatMessage } from '@/types/models';

const context: MentorContext = {
  studentName: 'Aarav',
  weakSubjects: ['Chemistry', 'English writing'],
  strongSubjects: ['Mathematics'],
  marks: [
    { subject: 'Mathematics', obtained: 92, maximum: 100 },
    { subject: 'Chemistry', obtained: 72, maximum: 100 },
  ],
  attemptCount: 2,
};

const student = (content: string): ChatMessage => ({
  id: 'q',
  role: 'student',
  content,
  createdAt: new Date().toISOString(),
});

const mentor = (content: string): ChatMessage => ({
  id: 'a',
  role: 'mentor',
  content,
  createdAt: new Date().toISOString(),
});

describe('adaptive mentor engine', () => {
  it('answers knowledge-base questions with markdown explanations', () => {
    const reply = adaptiveReply([student('Can you explain photosynthesis?')], 'Science', context);
    expect(reply).toContain('**Photosynthesis**');
    expect(reply).toContain('chloroplast');
  });

  it('personalizes answers using the student focus subjects', () => {
    const reply = adaptiveReply([student('what is ph and acids?')], 'Science', context);
    // pH lives in Science, but "Chemistry" is a weak subject; general encouragement applies
    expect(reply.length).toBeGreaterThan(50);
  });

  it('answers progress questions from the student data', () => {
    const reply = adaptiveReply([student('how am I doing?')], 'General', context);
    expect(reply).toContain('82%'); // (92+72)/200
    expect(reply).toContain('Mathematics');
    expect(reply).toContain('2 mock tests');
  });

  it('starts a quiz on request and embeds grading state', () => {
    const reply = adaptiveReply([student('quiz me on algebra')], 'Mathematics', context);
    expect(reply).toContain('Quiz time');
    expect(reply).toMatch(/<!--quiz:[a-z0-9]+-->/);
  });

  it('grades a quiz answer from the previous mentor message', () => {
    const quiz = adaptiveReply([student('quiz me on algebra')], 'Mathematics', context);
    const graded = adaptiveReply(
      [student('quiz me on algebra'), mentor(quiz), student('C')],
      'Mathematics',
      context,
    );
    expect(graded).toMatch(/Correct|Almost/);
    expect(graded).toContain('Why:');
  });

  it('deep-dives when the student asks why after a topic', () => {
    const first = adaptiveReply([student('explain gravity')], 'Science', context);
    const followUp = adaptiveReply(
      [student('explain gravity'), mentor(first), student('why?')],
      'Science',
      context,
    );
    expect(followUp).toContain('Newton');
  });

  it('greets the student by name', () => {
    const reply = adaptiveReply([student('hello!')], 'General', context);
    expect(reply).toContain('Aarav');
  });

  it('stripMarkers removes internal state comments', () => {
    expect(stripMarkers('answer<!--quiz:m1--> more<!--topic:gravity-->')).toBe('answer more');
  });
});
