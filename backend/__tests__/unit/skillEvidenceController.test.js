const { calculateConfidence } = require('../../controllers/skillEvidenceController');

// ─── calculateConfidence(evidenceSources, isVerified) ─────────────────────────
// Weights: resume=15, project=25, assessment=20, internship=15, learning=7,
//          certificate=20, interview=10, feedback=8
// strengthMultiplier: weak=0.5, moderate=1.0, strong=1.3
// Only first occurrence of each type counts.
// isVerified adds 10% bonus. Result capped at 100, returned as integer.

describe('calculateConfidence', () => {
  test('empty evidence array returns 0', () => {
    const result = calculateConfidence([], false);
    expect(result).toBe(0);
  });

  test('resume evidence with moderate strength adds 15 points', () => {
    const result = calculateConfidence([{ type: 'resume', strength: 'moderate' }], false);
    expect(result).toBe(15); // 15 * 1.0 = 15
  });

  test('resume evidence with strong strength gives more than weak', () => {
    const strong = calculateConfidence([{ type: 'resume', strength: 'strong' }], false);
    const weak = calculateConfidence([{ type: 'resume', strength: 'weak' }], false);
    expect(strong).toBeGreaterThan(weak);
  });

  test('strong strength applies 1.3x multiplier', () => {
    // project weight = 25, strong multiplier = 1.3 => Math.round(25*1.3) = 33
    const result = calculateConfidence([{ type: 'project', strength: 'strong' }], false);
    expect(result).toBe(Math.round(25 * 1.3));
  });

  test('weak strength applies 0.5x multiplier', () => {
    // resume weight=15, weak=0.5 => 7.5 => rounds to 8
    const result = calculateConfidence([{ type: 'resume', strength: 'weak' }], false);
    expect(result).toBe(Math.round(15 * 0.5));
  });

  test('isVerified adds 10% bonus', () => {
    const unverified = calculateConfidence([{ type: 'resume', strength: 'moderate' }], false);
    const verified = calculateConfidence([{ type: 'resume', strength: 'moderate' }], true);
    expect(verified).toBe(Math.round(unverified * 1.1));
  });

  test('score never exceeds 100', () => {
    const allTypes = [
      { type: 'resume', strength: 'strong' },
      { type: 'project', strength: 'strong' },
      { type: 'assessment', strength: 'strong' },
      { type: 'internship', strength: 'strong' },
      { type: 'learning', strength: 'strong' },
      { type: 'certificate', strength: 'strong' },
      { type: 'interview', strength: 'strong' },
      { type: 'feedback', strength: 'strong' },
    ];
    const result = calculateConfidence(allTypes, true);
    expect(result).toBeLessThanOrEqual(100);
  });

  test('duplicate type: only first occurrence counts', () => {
    const single = calculateConfidence([{ type: 'resume', strength: 'moderate' }], false);
    const duplicate = calculateConfidence(
      [{ type: 'resume', strength: 'moderate' }, { type: 'resume', strength: 'strong' }],
      false
    );
    expect(duplicate).toBe(single);
  });

  test('unknown type contributes 0 points', () => {
    const result = calculateConfidence([{ type: 'unknown_type', strength: 'strong' }], false);
    expect(result).toBe(0);
  });

  test('returns a number (integer)', () => {
    const result = calculateConfidence([{ type: 'resume', strength: 'moderate' }], false);
    expect(typeof result).toBe('number');
    expect(Number.isInteger(result)).toBe(true);
  });

  test('breakdown: project (25) + certificate (20) = 45 unverified', () => {
    const result = calculateConfidence(
      [{ type: 'project', strength: 'moderate' }, { type: 'certificate', strength: 'moderate' }],
      false
    );
    expect(result).toBe(45);
  });
});
