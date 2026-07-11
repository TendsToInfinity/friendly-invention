import { describe, expect, it } from 'vitest';
import { demoMarks, demoStudent } from '@/data/demo';
import { analyzePerformance, calculateOverallScore } from '@/lib/analytics';
import { pct, uid } from '@/lib/utils';
import { recommendCareers } from '@/services/career';

describe('score calculation', () => {
  it('calculates weighted overall percentage', () => {
    expect(
      calculateOverallScore([
        { subject: 'A', obtained: 40, maximum: 50 },
        { subject: 'B', obtained: 45, maximum: 50 },
      ]),
    ).toBe(85);
  });

  it('returns 0 for an empty report card instead of NaN', () => {
    expect(calculateOverallScore([])).toBe(0);
  });
});

describe('pct', () => {
  it('guards against division by zero', () => {
    expect(pct(50, 0)).toBe(0);
  });
});

describe('uid', () => {
  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uid()));
    expect(ids.size).toBe(1000);
  });
});

describe('performance analysis', () => {
  it('identifies strongest and improvement subjects', () => {
    const insight = analyzePerformance(demoMarks);
    expect(insight.strongest).toContain('Computer Science');
    expect(insight.improvement).toContain('Chemistry');
    expect(insight.summary).toContain(`${insight.overall}%`);
  });
});

describe('career match', () => {
  it('ranks career clusters with bounded exploratory scores', () => {
    const recs = recommendCareers(demoStudent, demoMarks);
    expect(recs.length).toBeGreaterThan(3);
    expect(recs[0].matchScore).toBeLessThanOrEqual(98);
    expect(recs[0].why).toContain('may fit');
  });

  it('sorts recommendations by descending match score', () => {
    const recs = recommendCareers(demoStudent, demoMarks);
    const scores = recs.map((rec) => rec.matchScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});
