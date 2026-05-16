const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'partner'],
      default: 'student',
    },
    active: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    partnerStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    lastLogin: {
      type: Date,
    },
    impersonationActive: {
      type: Boolean,
      default: false,
    },
    partnerInfo: {
      organization: { type: String },
      contactName: { type: String },
      contactPhone: { type: String },
    },
    // Profile Fields
    profilePicture: { type: String }, // Cloudinary URL
    university: { type: String },
    course: { type: String },
    preferredLocation: { type: String }, // For recommendation engine
    skills: { type: [String], default: [] },
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String
    }],
    projects: [{
      title: String,
      description: String,
      link: String
    }],
    resume: { type: String }, // URL to uploaded resume
    resumeUploaded: {
      type: Boolean,
      default: false
    },
    atsScore: {
      type: Number,
      default: 0
    },
    profileCompletionPercentage: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate profile completion on save
userSchema.pre('save', function (next) {
  if (this.role === 'admin') return next();

  let score = 0;
  const totalFields = 8; // name, email, phone, university, course, skills, resume, profilePicture

  if (this.name) score++;
  if (this.email) score++;
  if (this.phone) score++;
  if (this.university) score++;
  if (this.course) score++;
  if (this.skills && this.skills.length > 0) score++;
  if (this.resume) score++;
  if (this.profilePicture) score++;

  this.profileCompletionPercentage = Math.round((score / totalFields) * 100);
  next();
});

module.exports = mongoose.model('User', userSchema);
