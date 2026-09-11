# DEBUG SESSION: internship-edit-auth
[OPEN] 2026-09-10 | Created from Master Prompt repair

## Bug: Super Admin / Partner cannot edit posted internships

### Hypotheses
1. **H1-BE-Route**: No backend PUT/PATCH `/api/internships/:id` endpoint exists.
2. **H2-AuthZ**: Update controller missing role + ownership check (partner should only edit own, super admin any).
3. **H3-Query**: Mongo update uses wrong projection/options, returns stale doc, or only saves `_id`.
4. **H4-FE-EditBtn**: Frontend Internships page missing Edit button, or button hidden by role gate.
5. **H5-FE-Form**: Edit form not calling PUT API, uses POST create endpoint, or submit handler not wired.

### Evidence Log
- TBD

### Status
Phase: INSPECT & INSTRUMENT
