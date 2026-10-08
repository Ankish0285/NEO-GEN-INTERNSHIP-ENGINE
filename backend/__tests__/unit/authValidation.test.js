// Test input validation logic (no DB needed)
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password && password.length >= 6;
const validateSignupInput = (body) => {
  const errors = [];
  if (!body.name || body.name.trim().length < 2) errors.push('name required (min 2 chars)');
  if (!validateEmail(body.email || '')) errors.push('valid email required');
  if (!validatePassword(body.password)) errors.push('password min 6 characters');
  return errors;
};

describe('Auth Input Validation', () => {
  test('valid signup input has no errors', () => {
    expect(validateSignupInput({ name: 'Test User', email: 'test@example.com', password: 'pass123' })).toHaveLength(0);
  });

  test('missing all fields returns 3 errors', () => {
    expect(validateSignupInput({})).toHaveLength(3);
  });

  test('invalid email is caught', () => {
    const errors = validateSignupInput({ name: 'Test', email: 'notanemail', password: 'pass123' });
    expect(errors).toContain('valid email required');
  });

  test('short password is caught', () => {
    const errors = validateSignupInput({ name: 'Test', email: 'test@test.com', password: '123' });
    expect(errors).toContain('password min 6 characters');
  });

  test('valid emails pass', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user+tag@domain.co.in')).toBe(true);
  });

  test('invalid emails fail', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
  });
});
