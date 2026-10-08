const { calculateQualityScore } = require('../../controllers/internshipQualityController');

describe('calculateQualityScore', () => {
  test('empty internship returns low quality', () => {
    const result = calculateQualityScore({});
    expect(result.qualityScore).toBeLessThan(40);
    expect(result.riskLevel).toBe('high');
  });

  test('well-described internship returns higher score', () => {
    const internship = {
      description: 'A'.repeat(350),
      skills: ['React', 'Node.js', 'MongoDB'],
      duration: '3 months',
      stipend: '5000',
      requirements: 'Basic JS',
      createdBy: 'partner123'
    };
    const result = calculateQualityScore(internship);
    expect(result.qualityScore).toBeGreaterThan(40);
  });

  test('score is between 0 and 100', () => {
    const result = calculateQualityScore({
      description: 'A'.repeat(400),
      skills: ['a', 'b', 'c'],
      duration: '3m',
      stipend: '5000',
      requirements: 'r',
      createdBy: 'id',
      certificateOffered: true
    });
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.qualityScore).toBeLessThanOrEqual(100);
  });

  test('returns all required fields', () => {
    const result = calculateQualityScore({});
    expect(result).toHaveProperty('qualityScore');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('roiEstimate');
    expect(result).toHaveProperty('breakdown');
  });
});
