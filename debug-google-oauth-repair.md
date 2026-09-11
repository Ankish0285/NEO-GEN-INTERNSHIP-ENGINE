# DEBUG SESSION: google-oauth-repair
[OPEN] 2026-09-10 | Created from Master Prompt repair

## Bug: Login with Google not working (User / Super Admin / Partner)

### Hypotheses
1. **H1-Frontend**: Google button missing `@react-oauth/google` GoogleOAuthProvider wrapper, or Client ID undefined (env var not loaded).
2. **H2-BE-Route**: Backend `/api/auth/google/callback` or `/api/auth/google` route missing, or uses wrong library.
3. **H3-Verify**: Backend does not call `google-auth-library` OAuth2Client.verifyIdToken, or audience mismatch.
4. **H4-Role**: After Google login, role is hardcoded to `user` / role not preserved, redirecting wrong dashboard.
5. **H5-CORS-Cookie**: CORS origin mismatch or cookie/redirect URI not whitelisted in Google Cloud console or env.

### Evidence Log
- TBD

### Status
Phase: INSPECT & INSTRUMENT
