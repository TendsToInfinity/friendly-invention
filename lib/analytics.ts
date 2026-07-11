import type { PerformanceInsight, SubjectMark } from '@/types/models';
import { pct } from './utils';

/** Weighted overall percentage across all subjects (total obtained / total maximum). */
export function calculateOverallScore(marks: SubjectMark[]): number {
  const totals = marks.reduce(
    (acc, mark) => {
      acc.obtained += mark.obtained;
      acc.maximum += mark.maximum;
      return acc;
    },
    { obtained: 0, maximum: 0 },
  );
  return pct(totals.obtained, totals.maximum);
}

/**
 * Summarizes a report card: overall score, the two strongest subjects,
 * the two subjects with the most room to improve, and an encouraging summary.
 */
export function analyzePerformance(marks: SubjectMark[]): PerformanceInsight {
  const sorted = [...marks].sort(
    (a, b) => pct(b.obtained, b.maximum) - pct(a.obtained, a.maximum),
  );
  const overall = calculateOverallScore(marks);
  const strongest = sorted.slice(0, 2).map((mark) => mark.subject);
  const improvement = sorted.slice(-2).map((mark) => mark.subject);

  return {
    overall,
    strongest,
    improvement,
    summary: `You are at ${overall}%. Keep building strengths in ${sorted[0]?.subject ?? 'your best subject'} while giving gentle extra practice to ${sorted.at(-1)?.subject ?? 'priority areas'}.`,
  };
}
