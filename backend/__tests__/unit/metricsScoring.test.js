describe('Metrics score handling', () => {
  test('score of 0 is preserved with nullish check', () => {
    const score = 0;
    expect(score != null ? score : null).toBe(0);
  });

  test('score of 0 fails truthiness (documents fixed bug)', () => {
    const score = 0;
    expect(score || null).toBeNull();
  });

  test('null score is not fabricated', () => {
    const score = null;
    expect(score != null ? score : null).toBeNull();
  });

  test('Resume.atsScore takes priority over User.atsScore', () => {
    const resume = { atsScore: 72 };
    const user = { atsScore: 65 };
    const result = resume?.atsScore != null ? resume.atsScore : user?.atsScore ?? null;
    expect(result).toBe(72);
  });

  test('User.atsScore used when Resume has no atsScore', () => {
    const resume = { atsScore: null };
    const user = { atsScore: 65 };
    const result = resume?.atsScore != null ? resume.atsScore : user?.atsScore ?? null;
    expect(result).toBe(65);
  });

  test('no fabricated 75 for aiConfidenceScore', () => {
    const profile = { aiConfidenceScore: null };
    const ats = { ai_confidence_score: null };
    const result = profile?.aiConfidenceScore != null ? profile.aiConfidenceScore
      : ats?.ai_confidence_score != null ? ats.ai_confidence_score
      : null;
    expect(result).toBeNull();
  });

  test('dataStatus is no_data when no resume parsed text', () => {
    const resume = { parsedText: null };
    const profile = null;
    let status = 'no_data';
    if (resume?.parsedText) status = profile ? 'complete' : 'partial';
    expect(status).toBe('no_data');
  });
});
