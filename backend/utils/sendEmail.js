const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Validate required fields
    if (!options.email || !options.subject || !options.message) {
      throw new Error('Missing required email fields: email, subject, message');
    }

    const emailUser = (process.env.EMAIL_USER || '').trim();
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');

    if (!emailUser || !emailPass) {
      console.error('[Email] ❌ EMAIL CONFIGURATION MISSING');
      console.error('[Email] EMAIL_USER:', emailUser ? 'SET ✓' : 'NOT SET ✗');
      console.error('[Email] EMAIL_PASS:', emailPass ? 'SET ✓' : 'NOT SET ✗');
      console.error('[Email] ');
      console.error('[Email] 🔧 SETUP INSTRUCTIONS:');
      console.error('[Email] 1. Go to: https://myaccount.google.com/apppasswords');
      console.error('[Email] 2. Create App Password for "Mail" + "Windows Computer"');
      console.error('[Email] 3. Add to .env file:');
      console.error('[Email]    EMAIL_USER=your-email@gmail.com');
      console.error('[Email]    EMAIL_PASS=your-16-char-app-password');
      throw new Error('Email configuration missing. Check .env file: EMAIL_USER and EMAIL_PASS required');
    }

    console.log(`\n[Email] ═══════════════════════════════════════`);
    console.log(`[Email] 📧 Sending to: ${options.email}`);
    console.log(`[Email] 📝 Subject: ${options.subject}`);
    console.log(`[Email] 👤 From: ${emailUser}`);
    console.log(`[Email] ═══════════════════════════════════════`);

    // Create transporter using Gmail service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass, // Gmail App Password (spaces stripped if pasted with groups)
      },
    });

    // Verify connection before sending
    console.log('[Email] 🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('[Email] ✅ SMTP server ready');

    // Define email options with HTML template
    const htmlBody = options.html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 15px;">NEO GEN - Internship Engine</h2>
          <p style="color: #666; line-height: 1.6;">${options.message.replace(/\n/g, '<br>')}</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; 2026 NEO GEN Internship Engine. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    const message = {
      from: `NEO GEN <${emailUser}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: htmlBody
    };

    // Send email
    console.log('[Email] 📤 Sending email via Gmail SMTP...');
    const info = await transporter.sendMail(message);
    
    console.log(`[Email] ✅ EMAIL SENT SUCCESSFULLY`);
    console.log(`[Email] 📮 MessageId: ${info.messageId}`);
    console.log(`[Email] ⏱️  Response: ${info.response}`);
    console.log(`[Email] 📬 Status: Delivered to ${options.email}`);
    console.log(`[Email] ═══════════════════════════════════════\n`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\n[Email] ❌ EMAIL SENDING FAILED');
    console.error(`[Email] Error: ${error.message}`);
    console.error(`[Email] Code: ${error.code || 'N/A'}`);
    
    // Common Gmail errors with solutions
    if (error.code === 'EAUTH') {
      console.error('[Email] ═══════════════════════════════════════');
      console.error('[Email] 🔑 AUTHENTICATION ERROR');
      console.error('[Email] ');
      console.error('[Email] Solution:');
      console.error('[Email] 1. Go to: https://myaccount.google.com/apppasswords');
      console.error('[Email] 2. Enable 2-Step Verification (if not enabled)');
      console.error('[Email] 3. Create App Password:');
      console.error('[Email]    - Select "Mail" as app');
      console.error('[Email]    - Select "Windows Computer" as device');
      console.error('[Email] 4. Copy 16-character password (remove spaces)');
      console.error('[Email] 5. Update .env: EMAIL_PASS=xxxxxxxxxxxx');
      console.error('[Email] 6. Restart server');
      console.error('[Email] ═══════════════════════════════════════');
    } else if (error.code === 'ESOCKET' || error.message.includes('connect')) {
      console.error('[Email] ═══════════════════════════════════════');
      console.error('[Email] 🌐 CONNECTION ERROR');
      console.error('[Email] ');
      console.error('[Email] Possible causes:');
      console.error('[Email] - No internet connection');
      console.error('[Email] - Firewall blocking port 465/587');
      console.error('[Email] - Gmail servers down');
      console.error('[Email] - Antivirus blocking SMTP');
      console.error('[Email] ═══════════════════════════════════════');
    } else if (error.code === 'EENVELOPE') {
      console.error('[Email] ═══════════════════════════════════════');
      console.error('[Email] 📧 INVALID EMAIL ADDRESS');
      console.error('[Email] Check recipient email format');
      console.error('[Email] ═══════════════════════════════════════');
    }
    
    console.error(`[Email] Full stack: ${error.stack}`);
    console.error(`[Email] ═══════════════════════════════════════\n`);
    
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = sendEmail;
