# DEBUG SESSION: forgot-password-repair
[OPEN] 2026-09-10 | Created from Master Prompt repair

## Bug: Forgot Password not working (User / Super Admin / Partner)

### Hypotheses
1. **H1-Routes**: No backend routes exist for `/api/auth/forgot-password` or `/api/auth/reset-password`, or are commented out.
2. **H2-Controller**: Controller function missing / returns 500 / missing email service integration.
3. **H3-Model**: User model missing `resetPasswordToken` and `resetPasswordExpire` fields, or they use wrong type.
4. **H4-Email**: Nodemailer/SMTP not configured, EMAIL_* env vars missing, or transporter throws silent error.
5. **H5-Frontend**: No Forgot Password page route (`/reset-password/:token`) or API call uses wrong URL.

### Evidence Log
- TBD

### Status
Phase: INSPECT & INSTRUMENT
