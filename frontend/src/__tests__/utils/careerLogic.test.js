import { describe, test, expect } from 'vitest';

describe('Certificate ID Validation', () => {
  const isValidCertId = (id) => /^NGIE-\d{4}-[A-Z0-9]{6}$/.test(id);
  test('valid cert ID passes', () => expect(isValidCertId('NGIE-2026-ABC123')).toBe(true));
  test('invalid cert ID fails', () => expect(isValidCertId('invalid-id')).toBe(false));
});

describe('Priority Tier Logic', () => {
  const getTier = (score) => score >= 75 ? 'A' : score >= 50 ? 'B' : 'C';
  test('score>=75 is A', () => expect(getTier(80)).toBe('A'));
  test('score 50-74 is B', () => expect(getTier(60)).toBe('B'));
  test('score<50 is C', () => expect(getTier(30)).toBe('C'));
});

describe('Confidence Score Bounds', () => {
  const clampScore = (s) => Math.max(0, Math.min(100, s));
  test('clamp keeps score in 0-100', () => {
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(75)).toBe(75);
  });
});
