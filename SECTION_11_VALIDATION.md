# Section 11: Admin Features & Navigation - Validation Guide [6 Marks]

## Overview
This document provides step-by-step validation procedures for all admin-facing features implemented in Section 11.

---

## 11.1 Navigation Menu [1 Mark]

### Test Cases:

**TC 11.1.1: Admin Navbar Links**
1. Login as an admin user
2. Verify navbar displays: Dashboard, Manage Clubs/Organizers, Profile, Logout
3. Click "Dashboard" — verify navigates to `/admin/dashboard`
4. Click "Manage Clubs/Organizers" — verify navigates to `/admin/organizers`
5. Expected: All admin navigation links present and functional

**TC 11.1.2: Non-Admin Cannot Access Admin Routes**
1. Login as a participant user
2. Try navigating to `/admin/organizers` directly in URL bar
3. Verify access denied or redirect
4. Expected: ProtectedRoute blocks non-admin access

---

## 11.2 Club/Organizer Management [5 Marks]

### Add New Club/Organizer

**TC 11.2.1: Create Organizer — Auto-Generated Credentials**
1. Login as admin
2. Navigate to `/admin/organizers`
3. Click "+ Add New Club/Organizer"
4. Fill in: Organizer Name, Category, Description
5. Leave Email and Password fields blank
6. Click "Create Account"
7. Verify success message: "Organizer created successfully!"
8. Verify a yellow credentials card appears with auto-generated email and password
9. Verify email format: `{slug}@clubs.event.com`
10. Verify password is a strong random string (at least 12 chars, upper, lower, digit, special)
11. Expected: Account created with auto-generated credentials shown to admin

**TC 11.2.2: Create Organizer — Custom Credentials**
1. Click "+ Add New Club/Organizer"
2. Fill Organizer Name, Category, Description
3. Provide a custom Email (e.g., `techclub@example.com`)
4. Provide a custom Password (e.g., `MyPass@123!`)
5. Click "Create Account"
6. Verify credentials card shows the custom email and password you provided
7. Expected: Account created with custom credentials

**TC 11.2.3: New Organizer Can Login Immediately**
1. Copy the credentials from the yellow card
2. Logout from admin
3. On the login page, enter the organizer email and password
4. Click Login
5. Verify successful login — organizer dashboard loads
6. Expected: New organizer can immediately log in with generated credentials

**TC 11.2.4: Credential Warning Message**
1. After creating an organizer, verify the warning text:
   "⚠ Copy these credentials now. The password cannot be viewed again after leaving this page."
2. Navigate away and return to `/admin/organizers`
3. Verify the credentials card is no longer visible
4. Expected: Password is shown only once

**TC 11.2.5: Duplicate Email Prevention**
1. Create an organizer with email `test@clubs.event.com`
2. Try creating another organizer with the same email
3. Verify error: "Organizer with this email already exists"
4. Expected: Duplicate emails rejected

**TC 11.2.6: Validation — Required Fields**
1. Try creating organizer without Organizer Name — verify error
2. Try creating without Category — verify error
3. Try creating without Description — verify error
4. Expected: All required fields enforced

### View List of All Clubs/Organizers

**TC 11.2.7: Organizer List Table**
1. Navigate to `/admin/organizers`
2. Verify table with columns: Name, Email, Category, Events, Status, Created, Actions
3. Verify all organizer accounts are listed
4. Verify summary counts: Total, Active, Disabled
5. Expected: Full organizer table with correct data

**TC 11.2.8: Event Count Per Organizer**
1. In the table, verify the "Events" column shows the correct number of events each organizer has created
2. Cross-check with the organizer's dashboard
3. Expected: Event counts accurate

### Disable/Enable Club/Organizer

**TC 11.2.9: Disable Organizer**
1. Find an active organizer in the list
2. Click "Disable" button
3. Verify status badge changes from green "Active" to red "Disabled"
4. Verify the row becomes slightly transparent (opacity)
5. Verify the button text changes to "Enable"
6. Expected: Organizer disabled, status updated in real-time

**TC 11.2.10: Disabled Organizer Cannot Login**
1. Disable an organizer via the admin panel
2. Logout from admin
3. Try logging in with the disabled organizer's credentials
4. Verify error: "Account has been disabled. Contact administrator." (or token rejected)
5. Expected: Disabled accounts cannot authenticate

**TC 11.2.11: Re-Enable Organizer**
1. Login as admin
2. Find the disabled organizer
3. Click "Enable" button
4. Verify status changes back to green "Active"
5. Logout and login as the re-enabled organizer
6. Verify login works again
7. Expected: Account re-enabled, can login

### Remove Club/Organizer

**TC 11.2.12: Delete Organizer — Confirmation**
1. Click "Delete" on an organizer
2. Verify a confirmation dialog appears: "Permanently delete this organizer and all their data?"
3. Click Cancel
4. Verify organizer still in list
5. Expected: Delete requires confirmation

**TC 11.2.13: Delete Organizer — Permanent**
1. Click "Delete" on an organizer and confirm
2. Verify organizer removed from the table
3. Verify success message: "Organizer deleted permanently."
4. Try logging in as the deleted organizer
5. Verify login fails
6. Expected: Organizer permanently removed

**TC 11.2.14: Reset Password**
1. Click "Reset Password" on an organizer
2. Enter a new password in the prompt (e.g., `NewPass@456!`)
3. Confirm
4. Verify success alert: "Password reset successfully."
5. Logout and login as that organizer with the new password
6. Expected: Password reset works, organizer can use new password

**TC 11.2.15: Reset Password — Validation**
1. Click "Reset Password" on an organizer
2. Enter a weak password (e.g., `123`)
3. Verify error about password requirements
4. Expected: Password validation enforced on reset

---

## Backend API Validation

**API 11.1: POST /api/admin/create-organizer (auto-generate)**
```bash
curl -X POST http://localhost:5000/api/admin/create-organizer \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"organizerName": "Tech Club", "category": "Technical", "description": "Tech events club"}'
```
Expected: 201 response with `credentials.email` (auto-generated) and `credentials.password` (random)

**API 11.2: POST /api/admin/create-organizer (with custom credentials)**
```bash
curl -X POST http://localhost:5000/api/admin/create-organizer \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"organizerName": "Art Club", "category": "Cultural", "description": "Arts club", "email": "art@clubs.com", "password": "ArtPass@123!"}'
```
Expected: 201 with custom email/password in credentials

**API 11.3: GET /api/admin/organizers**
```bash
curl -X GET http://localhost:5000/api/admin/organizers \
  -H "Authorization: Bearer <admin_token>"
```
Expected: Array of organizers with `eventCount`, `isDisabled`, `organizerName`, `category`, `email`, etc.

**API 11.4: PATCH /api/admin/organizers/:id/toggle**
```bash
curl -X PATCH http://localhost:5000/api/admin/organizers/<org_id>/toggle \
  -H "Authorization: Bearer <admin_token>"
```
Expected: `{ organizer: { isDisabled: true/false } }` — toggles between enabled and disabled

**API 11.5: DELETE /api/admin/organizers/:id**
```bash
curl -X DELETE http://localhost:5000/api/admin/organizers/<org_id> \
  -H "Authorization: Bearer <admin_token>"
```
Expected: Organizer permanently deleted

**API 11.6: POST /api/admin/reset-organizer-password**
```bash
curl -X POST http://localhost:5000/api/admin/reset-organizer-password \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"organizerId": "<org_id>", "newPassword": "NewPass@456!"}'
```
Expected: Password updated, organizer can login with new password

**API 11.7: Disabled user token rejection**
```bash
# 1. Disable an organizer via toggle
# 2. Try using a previously valid token for that organizer
curl -X GET http://localhost:5000/api/events/my-events \
  -H "Authorization: Bearer <disabled_organizer_token>"
```
Expected: 403 "Account has been disabled. Contact administrator."

---

## Database Verification

### Check Organizer isDisabled Field:
```javascript
db.users.findOne({ role: "organizer", email: "techclub@clubs.event.com" }, { isDisabled: 1, email: 1 })
```
Expected: `{ isDisabled: true/false }`

### Check Auto-Generated Email Format:
```javascript
db.users.find({ role: "organizer", email: /@clubs.event.com$/ }, { email: 1, organizerName: 1 })
```
Expected: Emails follow the pattern `{slug}@clubs.event.com`

### Verify Organizer Deletion:
```javascript
db.users.findOne({ _id: ObjectId("<deleted_org_id>") })
```
Expected: `null` (document no longer exists)

---

## Completion Checklist [6 Marks]

### 11.1 Navigation Menu [1 Mark]
- [ ] Admin navbar shows: Dashboard, Manage Clubs/Organizers, Profile, Logout
- [ ] "Manage Clubs/Organizers" navigates to `/admin/organizers`
- [ ] Non-admin users cannot access admin routes

### 11.2 Club/Organizer Management [5 Marks]
- [ ] Create organizer with auto-generated email + password
- [ ] Auto-generated email format: `{slug}@clubs.event.com`
- [ ] Auto-generated password meets strength requirements
- [ ] Credentials displayed in yellow card after creation
- [ ] Warning message about one-time password visibility
- [ ] Create organizer with custom email + password
- [ ] New organizer can immediately login with provided credentials
- [ ] Duplicate email rejected
- [ ] Required fields validated (name, category, description)
- [ ] Organizer list table shows all organizers with correct columns
- [ ] Event count per organizer displayed
- [ ] Summary counts (Total / Active / Disabled) shown
- [ ] Disable organizer — status badge changes, row dims
- [ ] Disabled organizer cannot log in (403 from middleware)
- [ ] Re-enable organizer — can log in again
- [ ] Delete organizer — confirmation dialog shown
- [ ] Deleted organizer permanently removed, cannot log in
- [ ] Reset password — prompt + save + new password works
- [ ] Reset password validates strength requirements

---

## Testing Priority

**CRITICAL (Must Pass):**
- Admin navbar links correct
- Create organizer with auto-generated credentials
- Credentials displayed to admin
- New organizer can login immediately
- Disable blocks login
- Delete permanently removes account

**HIGH (Important):**
- Enable restores login
- Reset password works
- Event count accurate
- Duplicate email prevention

**MEDIUM (Nice to Have):**
- Password strength in generated passwords
- Summary counts update after actions
- Table opacity change for disabled accounts

---

## Success Criteria

Section 11 is considered complete when:
1. All 6 marks' worth of features are functional
2. All CRITICAL test cases pass
3. Admin can create, disable, enable, delete, and reset password for organizers
4. Auto-generated credentials are shown once and the organizer can login immediately
5. Disabled accounts are blocked at the middleware level
6. Navigation menu has all required links

---

**Validation Date:** ___________
**Tested By:** ___________
**Status:** ___________
