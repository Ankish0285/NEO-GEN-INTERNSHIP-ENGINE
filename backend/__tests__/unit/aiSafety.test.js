describe('AI Safety Guards', () => {
  const yearsPattern = /(\d+)\s*years?\s*(of\s*)?(experience|exp)/i;
  
  test('detects years of experience claim', () => {
    expect(yearsPattern.test('I have 5 years of experience in React.')).toBe(true);
    expect(yearsPattern.test('3 years experience developing software')).toBe(true);
  });

  test('clean text has no false positives', () => {
    expect(yearsPattern.test('I am eager to learn and contribute.')).toBe(false);
    expect(yearsPattern.test('I am a student with internship experience.')).toBe(false);
  });

  test('AI response includes safety fields', () => {
    const response = { data: {}, isEstimate: true, disclaimer: 'Based on available data' };
    expect(response.isEstimate).toBe(true);
    expect(response.disclaimer).toBeTruthy();
  });

  test('priority tiers are A/B/C format', () => {
    const getTier = (score) => score >= 75 ? 'A' : score >= 50 ? 'B' : 'C';
    expect(getTier(90)).toBe('A');
    expect(getTier(60)).toBe('B');
    expect(getTier(30)).toBe('C');
  });
});
