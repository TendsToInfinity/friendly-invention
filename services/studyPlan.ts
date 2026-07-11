import { uid } from '@/lib/utils';
import type { Student, StudyPlan, StudyTask } from '@/types/models';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const FALLBACK_FOCUS_SUBJECTS = ['Science', 'English'];
const FALLBACK_REVISION_SUBJECT = 'Mathematics';

/**
 * Builds a week of tasks: one focused-practice block on an improvement
 * subject plus a shorter revision block on a strong subject per day.
 */
export function generateStudyPlan(student: Student): StudyPlan {
  const focusSubjects = student.academic.improvementSubjects.length
    ? student.academic.improvementSubjects
    : FALLBACK_FOCUS_SUBJECTS;
  const strongSubjects = student.academic.strongSubjects;

  const tasks: StudyTask[] = DAYS.flatMap((day, index) => {
    const focusSubject = focusSubjects[index % focusSubjects.length];
    const revisionSubject = strongSubjects[index % strongSubjects.length] ?? FALLBACK_REVISION_SUBJECT;

    return [
      {
        id: uid(),
        day,
        title: `Focused practice: ${focusSubject}`,
        subject: focusSubject,
        durationMinutes: 45,
        priority: index < 3 ? 'High' : 'Medium',
        completed: false,
      },
      {
        id: uid(),
        day,
        title: 'Revision and error log',
        subject: revisionSubject,
        durationMinutes: 30,
        priority: 'Low',
        completed: false,
      },
    ];
  });

  return { id: uid(), generatedAt: new Date().toISOString(), tasks };
}
