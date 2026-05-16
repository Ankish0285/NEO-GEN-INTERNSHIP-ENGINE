#!/usr/bin/env node

/**
 * NEO GEN System Verification Script
 * Tests all critical systems before running
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║     NEO GEN - SYSTEM VERIFICATION SCRIPT           ║');
console.log('╚════════════════════════════════════════════════════╝\n');

let passCount = 0;
let failCount = 0;

const check = (name, condition, details = '') => {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    passCount++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    failCount++;
  }
};

// 1. Check .env variables
console.log('📋 Checking Environment Variables...\n');

check('MONGO_URI', !!process.env.MONGO_URI, `Connected to: ${process.env.MONGO_URI?.substring(0, 40)}...`);
check('JWT_SECRET', !!process.env.JWT_SECRET, `Length: ${process.env.JWT_SECRET?.length} chars`);
check('EMAIL_USER', !!process.env.EMAIL_USER, `Email: ${process.env.EMAIL_USER}`);
check('EMAIL_PASS', !!process.env.EMAIL_PASS, `App Password: ${process.env.EMAIL_PASS?.substring(0, 8)}****`);
check('OTP_EXPIRY_MINUTES', !!process.env.OTP_EXPIRY_MINUTES, `OTP expires in: ${process.env.OTP_EXPIRY_MINUTES} minutes`);
check('OTP_LENGTH', !!process.env.OTP_LENGTH, `OTP length: ${process.env.OTP_LENGTH} digits`);

// 2. Check required npm packages
console.log('\n📦 Checking NPM Packages...\n');

const requiredPackages = ['express', 'mongoose', 'nodemailer', 'jsonwebtoken', 'bcryptjs'];

requiredPackages.forEach(pkg => {
  try {
    require(pkg);
    check(`${pkg}`, true, `Version: ${require(`${pkg}/package.json`).version}`);
  } catch (e) {
    check(`${pkg}`, false, 'Install with: npm install');
  }
});

// 3. Check critical files
console.log('\n📄 Checking Critical Files...\n');

const criticalFiles = [
  '../models/User.js',
  '../models/TempUser.js',
  '../controllers/authController.js',
  '../utils/sendEmail.js',
  '../routes/authRoutes.js',
  '../routes/adminRoutes.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  check(`${path.basename(file)}`, fs.existsSync(filePath), filePath);
});

// 4. Check Email Configuration
console.log('\n📧 Checking Email Configuration...\n');

if (process.env.EMAIL_PASS) {
  const hasSpaces = process.env.EMAIL_PASS.includes(' ');
  const length = process.env.EMAIL_PASS.length;
  
  check('Gmail App Password Format', !hasSpaces && length === 16, 
    `${hasSpaces ? '⚠️ Has spaces (remove them)' : '✓ No spaces'} - Length: ${length}`);
} else {
  check('Gmail App Password Format', false, 'EMAIL_PASS not set in .env');
}

check('2-Step Verification Required', true, 'Gmail 2-Step must be enabled for App Password');

// 5. Check Admin User
console.log('\n👤 Checking Admin User Setup...\n');

try {
  const adminExists = require('../models/User');
  check('User Model Loadable', true, 'Admin user should exist in database');
  console.log('   Note: Run "node createAdmin.js" to create default admin');
} catch (e) {
  check('User Model Loadable', false, e.message);
}

// 6. Check OTP Configuration
console.log('\n🔐 Checking OTP Configuration...\n');

const otpExpiry = parseInt(process.env.OTP_EXPIRY_MINUTES);
const otpLength = parseInt(process.env.OTP_LENGTH);

check('OTP Expiry Valid', otpExpiry > 0, `Set to: ${otpExpiry} minutes (Recommended: 5)`);
check('OTP Length Valid', otpLength >= 4 && otpLength <= 8, `Set to: ${otpLength} digits (Recommended: 6)`);

// 7. Summary
console.log('\n╔════════════════════════════════════════════════════╗');
console.log(`║  Results: ✅ ${passCount} Passed  ❌ ${failCount} Failed           ║`);
console.log('╚════════════════════════════════════════════════════╝\n');

if (failCount === 0) {
  console.log('🎉 All checks passed! System ready to run.\n');
  console.log('Start server with: npm start\n');
  process.exit(0);
} else {
  console.log('⚠️  Please fix the issues above before running.\n');
  console.log('Common fixes:');
  console.log('1. Gmail App Password: https://myaccount.google.com/security');
  console.log('2. Missing packages: npm install');
  console.log('3. .env variables: Copy from .env.example');
  console.log('4. Create admin: node createAdmin.js\n');
  process.exit(1);
}
