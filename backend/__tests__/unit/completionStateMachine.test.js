// State machine logic extracted for testing
const VALID_TRANSITIONS = {
  'applied': ['selected'],
  'selected': ['started'],
  'started': ['in_progress'],
  'in_progress': ['completed', 'terminated'],
  'completed': [],
  'terminated': [],
};
const canTransition = (from, to) => (VALID_TRANSITIONS[from] || []).includes(to);

describe('Completion State Machine', () => {
  test('applied → selected is valid', () => expect(canTransition('applied', 'selected')).toBe(true));
  test('selected → started is valid', () => expect(canTransition('selected', 'started')).toBe(true));
  test('started → in_progress is valid', () => expect(canTransition('started', 'in_progress')).toBe(true));
  test('in_progress → completed is valid', () => expect(canTransition('in_progress', 'completed')).toBe(true));
  test('in_progress → terminated is valid', () => expect(canTransition('in_progress', 'terminated')).toBe(true));
  test('completed is terminal', () => expect(canTransition('completed', 'started')).toBe(false));
  test('terminated is terminal', () => expect(canTransition('terminated', 'in_progress')).toBe(false));
  test('cannot skip states', () => expect(canTransition('applied', 'completed')).toBe(false));
  test('invalid from-state returns false', () => expect(canTransition('unknown', 'selected')).toBe(false));
});
