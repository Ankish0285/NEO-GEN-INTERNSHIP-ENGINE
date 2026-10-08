const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `NGIE-${year}-${random}`;
};

describe('Certificate ID Generation', () => {
  test('matches NGIE-YYYY-XXXXXX format', () => {
    expect(generateCertificateId()).toMatch(/^NGIE-\d{4}-[A-Z0-9]{6}$/);
  });

  test('contains current year', () => {
    expect(generateCertificateId()).toContain(String(new Date().getFullYear()));
  });

  test('IDs are unique', () => {
    const ids = new Set(Array.from({ length: 50 }, generateCertificateId));
    expect(ids.size).toBeGreaterThan(45);
  });

  test('starts with NGIE-', () => {
    expect(generateCertificateId().startsWith('NGIE-')).toBe(true);
  });
});
