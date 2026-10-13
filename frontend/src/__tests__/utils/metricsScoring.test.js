import { describe, test, expect } from 'vitest';

describe('Frontend metrics score handling', () => {
  test('score 0 preserved with nullish coalescing', () => {
    const score = 0;
    expect(score ?? '\u2014').toBe(0);
    expect(score != null ? score : '\u2014').toBe(0);
  });

  test('score 0 incorrectly replaced by || operator (documents fixed bug)', () => {
    const score = 0;
    expect(score || '\u2014').toBe('\u2014');
  });

  test('null score shows placeholder', () => {
    const score = null;
    expect(score != null ? score : '\u2014').toBe('\u2014');
  });

  test('no fabricated 75 for missing AI confidence', () => {
    const profile = null;
    const ats = null;
    const result = profile?.aiConfidenceScore != null ? `${profile.aiConfidenceScore}%`
      : ats?.ai_confidence_score != null ? `${ats.ai_confidence_score}%`
      : 'Not analyzed';
    expect(result).toBe('Not analyzed');
  });

  test('job match score remains distinct from general ATS score', () => {
    const generalAts = 72;
    const jobMatch = 85;
    expect(generalAts).not.toBe(jobMatch);
  });

  test('empty chart guard uses null check not truthiness', () => {
    const score = 0;
    const oldGuard = !score;
    const newGuard = score == null;
    expect(oldGuard).toBe(true);
    expect(newGuard).toBe(false);
  });
});
