const mongoose = require('mongoose');

const textBlockSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    body: { type: String, default: '' },
  },
  { _id: false }
);

const featureSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    branding: {
      logoUrl: { type: String, default: '' },
      brandNameLine1: { type: String, default: 'NEO' },
      brandNameLine2: { type: String, default: 'GEN' },
      brandSubtitle: { type: String, default: 'INTERNSHIP ENGINE' },
      primaryColor: { type: String, default: '#f97316' },
      secondaryColor: { type: String, default: '#16a34a' },
    },
    hero: {
      backgroundImage: { type: String, default: '' },
      titleBefore: { type: String, default: '' },
      titleHighlight1: { type: String, default: 'NEO' },
      titleHighlight2: { type: String, default: 'GEN' },
      subtitle: { type: String, default: '' },
      primaryButtonText: { type: String, default: 'Find an Internship' },
      secondaryButtonText: { type: String, default: 'Post an Internship' },
      overlayOpacity: { type: Number, default: 0.7 },
    },
    about: {
      titleHighlight1: { type: String, default: 'NEO' },
      titleHighlight2: { type: String, default: 'GEN' },
      intro: { type: String, default: '' },
      missionTitle: { type: String, default: '' },
      missionText: { type: String, default: '' },
      partnershipsTitle: { type: String, default: '' },
      partnershipsText: { type: String, default: '' },
      features: { type: [featureSchema], default: [] },
    },
    howItWorks: {
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      steps: { type: [stepSchema], default: [] },
    },
    contact: {
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      phoneTollFree: { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      addressLine3: { type: String, default: '' },
      supportHours: { type: String, default: '' },
    },
    footer: {
      description: { type: String, default: '' },
      copyright: { type: String, default: '' },
    },
    social: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    resources: {
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      ctaText: { type: String, default: '' },
    },
    policies: {
      privacy: { type: textBlockSchema, default: () => ({}) },
      terms: { type: textBlockSchema, default: () => ({}) },
      cookies: { type: textBlockSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
