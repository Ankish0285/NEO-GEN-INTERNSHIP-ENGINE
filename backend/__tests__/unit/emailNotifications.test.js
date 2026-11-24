// Unit tests for the centralized email notification system.
// Pure / mocked — no MongoDB connection, no live SMTP.
const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail: mockSendMail }),
}));

const templates = require('../../utils/emailTemplates');
const emailService = require('../../services/emailService');

const { EVENT_CATEGORY_MAP, chunk, sendWithRetry } = emailService;

let origEmailUser;
let origEmailPass;

beforeAll(() => {
  origEmailUser = process.env.EMAIL_USER;
  origEmailPass = process.env.EMAIL_PASS;
  process.env.EMAIL_USER = 'test@gmail.com';
  process.env.EMAIL_PASS = 'testpassword';
});

afterAll(() => {
  if (origEmailUser === undefined) delete process.env.EMAIL_USER;
  else process.env.EMAIL_USER = origEmailUser;
  if (origEmailPass === undefined) delete process.env.EMAIL_PASS;
  else process.env.EMAIL_PASS = origEmailPass;
});

beforeEach(() => {
  mockSendMail.mockReset();
});

describe('chunk', () => {
  test('splits [1..7] into groups of 3', () => {
    expect(chunk([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  test('empty array yields empty result', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  test('exact multiple has no trailing empty group', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });
});

describe('EVENT_CATEGORY_MAP', () => {
  test('maps every EmailLog eventType to a SiteSettings category', () => {
    expect(Object.keys(EVENT_CATEGORY_MAP)).toHaveLength(6);
    expect(EVENT_CATEGORY_MAP.welcome).toBe('welcomeEmail');
    expect(EVENT_CATEGORY_MAP.new_internship).toBe('newInternship');
    expect(EVENT_CATEGORY_MAP.success_story).toBe('successStory');
    expect(EVENT_CATEGORY_MAP.certificate_issued).toBe('certificateIssued');
    expect(EVENT_CATEGORY_MAP.certificate_status).toBe('certificateStatus');
    expect(EVENT_CATEGORY_MAP.announcement).toBe('announcements');
  });
});

describe('emailTemplates', () => {
  const user = { name: 'Ankit', email: 'ankit@example.com' };
  const internship = {
    _id: '65f1a1a1a1a1a1a1a1a1a1a1',
    title: 'Backend Intern',
    organization: 'Acme',
    location: 'Remote',
    duration: '3 months',
    stipend: '₹10,000',
  };
  const story = { _id: '65f2b2b2b2b2b2b2b2b2b2b2', name: 'Ria', college: 'IIT Delhi', company: 'Google', experience: 'Great' };
  const cert = {
    _id: '65f3c3c3c3c3c3c3c3c3c3c3',
    certificateId: 'NEOGEN-CERT-AB12',
    title: 'Completion',
    organization: 'Acme',
    role: 'SDE Intern',
    verificationId: 'uuid-123',
  };
  const ctaUrl = 'https://neogeninternshipengine.me/blog/v2';
  const announcement = { subject: 'Big Update', title: 'Platform Announcement', body: 'We shipped v2', cta: 'Read more', ctaUrl };

  const cases = [
    ['welcomeEmail', () => templates.welcomeEmail(user), null],
    ['newInternshipEmail', () => templates.newInternshipEmail(user, internship), '/internships/'],
    ['newSuccessStoryEmail', () => templates.newSuccessStoryEmail(user, story), '/success-stories'],
    ['certificateIssuedEmail', () => templates.certificateIssuedEmail(user, cert), '/dashboard/passport'],
    ['certificateStatusEmail', () => templates.certificateStatusEmail(user, cert, 'active'), '/dashboard/passport'],
    ['announcementEmail', () => templates.announcementEmail(user, announcement), ctaUrl],
  ];

  test.each(cases)('%s returns {subject, html} with NEOGEN header', (_name, fn, expectedCta) => {
    const out = fn();
    expect(typeof out.subject).toBe('string');
    expect(out.subject.length).toBeGreaterThan(0);
    expect(typeof out.html).toBe('string');
    expect(out.html).toContain('NEOGEN');
    if (expectedCta) expect(out.html).toContain(expectedCta);
  });

  test('certificateStatusEmail reflects revoked label in subject', () => {
    const out = templates.certificateStatusEmail(user, cert, 'revoked');
    expect(out.subject).toContain('Revoked');
    expect(out.html).toContain('revoked');
  });
});

describe('sendWithRetry', () => {
  test('succeeds on the first attempt', async () => {
    mockSendMail.mockResolvedValueOnce({ messageId: 'm-1', response: '250 OK' });
    const res = await sendWithRetry({ to: 'a@b.com', subject: 'Hi', html: '<b>x</b>', text: 'Hi' });
    expect(res.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  test('retries 3x then throws on persistent failure', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP down'));
    await expect(sendWithRetry({ to: 'a@b.com', subject: 'Hi', html: '<b>x</b>' })).rejects.toThrow('SMTP down');
    expect(mockSendMail).toHaveBeenCalledTimes(3);
  }, 15000);
});
