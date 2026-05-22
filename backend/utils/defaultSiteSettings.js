const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';

const defaultSiteSettings = {
  key: 'main',
  branding: {
    logoUrl: '',
    brandNameLine1: 'NEO',
    brandNameLine2: 'GEN',
    brandSubtitle: 'INTERNSHIP ENGINE',
    primaryColor: '#f97316',
    secondaryColor: '#16a34a',
  },
  hero: {
    backgroundImage: DEFAULT_HERO_IMAGE,
    backgroundImages: [DEFAULT_HERO_IMAGE],
    titleBefore: 'Launch Your Career with',
    titleHighlight1: 'NEO',
    titleHighlight2: 'GEN',
    subtitle:
      'Discover opportunities across various government departments and ministries with AI-powered matching, ATS score optimization, and 24/7 chatbot support.',
    primaryButtonText: 'Find an Internship',
    secondaryButtonText: 'Post an Internship',
    overlayOpacity: 0.7,
  },
  about: {
    titleHighlight1: 'NEO',
    titleHighlight2: 'GEN',
    intro:
      "Empowering India's youth with government internship opportunities. NEO GEN is India's premier government internship portal, connecting talented students with meaningful opportunities.",
    missionTitle: 'Our Mission',
    missionText:
      'We believe in building the future of public service through technology and innovation, bridging the gap between talent and government administration.',
    partnershipsTitle: 'Government Partnerships',
    partnershipsText:
      'We work closely with major government departments including NITI Aayog, Ministry of External Affairs, MeitY, ISRO, and many more to bring you authentic opportunities.',
    features: [
      { title: 'Precision Matching', description: 'Advanced AI algorithms ensure perfect alignment between your profile and available opportunities.' },
      { title: 'ATS Optimization', description: 'Get your resume optimized for Applicant Tracking Systems used by government agencies.' },
      { title: 'AI Assistant', description: '24/7 intelligent support to guide you through every step of your internship journey.' },
      { title: 'Government Network', description: 'Direct partnerships with major government departments and ministries across India.' },
    ],
  },
  howItWorks: {
    title: 'How It Works',
    subtitle: 'Your journey to a government internship in three simple steps',
    steps: [
      { title: 'Search', description: 'Search through thousands of government internships tailored to your skills and interests. Filter by location, department, and duration.' },
      { title: 'Apply', description: 'Create your profile, upload your resume, and apply to multiple opportunities with a single click. Our ATS-friendly system helps you stand out.' },
      { title: 'Get Hired', description: 'Track your application status, ace the interview, and kickstart your career in public service. Receive offer letters directly through the portal.' },
    ],
  },
  contact: {
    title: 'Get In Touch',
    subtitle:
      "Have questions about our internship programs or need support? We'd love to hear from you. Fill out the form below and we'll respond as soon as possible.",
    email: 'support@neogen.gov.in',
    phone: '+91 123 456 7890',
    phoneTollFree: '1800-123-456 (Toll Free)',
    addressLine1: 'Ministry of Skill Development',
    addressLine2: 'Shram Shakti Bhawan',
    addressLine3: 'New Delhi - 110001',
    supportHours: 'Mon - Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 2:00 PM',
  },
  footer: {
    description:
      'Empowering the next generation of professionals through meaningful internship opportunities with government and private organizations.',
    copyright: 'Neo Gen Internship Engine. All rights reserved.',
  },
  social: {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
  },
  resources: {
    title: 'Resume Templates',
    subtitle: 'Download modern, ATS-friendly resume templates for different roles.',
    ctaText: 'Explore Roles',
  },
  team: {
    title: 'Built By',
    subtitle: 'Meet the team behind NEO GEN Internship Engine',
    members: [],
  },
  policies: {
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      body: 'We collect only what’s needed to operate the platform: account details, profile information, applications, and support messages.\n\nData is stored securely and used to match internships, improve services, and comply with legal requirements. We never sell your data.\n\nYou can access, update, or delete your information by contacting support. For security, we use encryption and strict access controls.',
    },
    terms: {
      title: 'Terms of Service',
      subtitle: 'Simple rules for using NEO GEN',
      body: 'Use accurate information and respect application guidelines. Do not submit false documents or misuse the platform.\n\nWe provide best-effort matching and tools; selections are made by partnering agencies. Accounts may be limited or terminated for policy violations.\n\nBy using NEO GEN, you agree to these terms and our privacy and cookie policies.',
    },
    cookies: {
      title: 'Cookie Policy',
      subtitle: 'Cookies that keep things running',
      body: 'We use essential cookies for login, session security, and analytics to improve performance. No tracking for advertising.\n\nYou can control cookies in your browser. Disabling essential cookies may affect core features like authentication.',
    },
  },
};

module.exports = { defaultSiteSettings, DEFAULT_HERO_IMAGE };
