import { clusters } from '@/data/demo';
import { pct } from '@/lib/utils';
import type { CareerCluster, CareerRecommendation, Student, SubjectMark } from '@/types/models';

/** Score used when the student has no mark for a cluster subject. */
const NEUTRAL_SUBJECT_SCORE = 65;
const INTEREST_BOOST = 12;
const BASE_BOOST = 12;
const MAX_MATCH_SCORE = 98;

function subjectScoreFor(subject: string, marks: SubjectMark[]): number {
  const mark = marks.find(
    (candidate) => candidate.subject.includes(subject) || subject.includes(candidate.subject),
  );
  return mark ? pct(mark.obtained, mark.maximum) : NEUTRAL_SUBJECT_SCORE;
}

function matchesInterests(cluster: CareerCluster, student: Student): boolean {
  const haystack = `${cluster.description} ${cluster.name}`.toLowerCase();
  return student.interests
    .concat(student.careerInterests)
    .some((interest) => haystack.includes(interest.toLowerCase()));
}

/**
 * Ranks career clusters by subject performance plus interest overlap.
 * Scores are intentionally capped and framed as exploration, not prescription.
 */
export function recommendCareers(student: Student, marks: SubjectMark[]): CareerRecommendation[] {
  return clusters
    .map((cluster) => {
      const subjectScore =
        cluster.subjects.reduce((total, subject) => total + subjectScoreFor(subject, marks), 0) /
        cluster.subjects.length;
      const interestBoost = matchesInterests(cluster, student) ? INTEREST_BOOST : 0;

      return {
        cluster,
        matchScore: Math.min(MAX_MATCH_SCORE, Math.round(subjectScore * 0.75 + interestBoost + BASE_BOOST)),
        why: `This cluster may fit because it connects with ${cluster.subjects.join(', ')} and skills like ${cluster.skills.slice(0, 2).join(' and ')}.`,
        nextSteps: [
          `Explore beginner projects in ${cluster.name}.`,
          'Talk with a teacher, parent, or qualified counselor.',
          'Compare day-to-day work before deciding.',
        ],
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
