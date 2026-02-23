# Section 9: Participant Features & Navigation - Validation Guide [22 Marks]

## Overview
This document provides step-by-step validation procedures for all participant-facing features implemented in Section 9.

---

## 9.1 Navigation Menu [1 Mark]

### Test Cases:

**TC 9.1.1: Participant Navigation**
1. Login as a participant user
2. Verify navbar displays: Dashboard, Browse Events, Clubs/Organizers, Profile, Logout
3. Click each link and verify correct routing
4. Expected: All links functional, proper navigation to respective pages

**TC 9.1.2: Organizer Navigation**
1. Login as an organizer user
2. Verify navbar displays: Dashboard, Create Event, Profile, Logout
3. Click each link and verify correct routing
4. Expected: Organizer-specific navigation displayed

**TC 9.1.3: Admin Navigation**
1. Login as an admin user
2. Verify navbar displays: Admin Dashboard, Profile, Logout
3. Click each link and verify correct routing
4. Expected: Admin-specific navigation displayed

---

## 9.2 My Events Dashboard [6 Marks]

### Test Cases:

**TC 9.2.1: Upcoming Events Tab**
1. Login as participant with registered events
2. Navigate to Participant Dashboard
3. Click "Upcoming" tab
4. Verify only future events are displayed (registrationDate > current date)
5. Verify each event card shows: title, type badge, description, dates, location, fee, ticket ID, QR code
6. Verify "Unregister" button is present
7. Expected: Future events displayed with complete information

**TC 9.2.2: Normal Events Tab**
1. Click "Normal" tab
2. Verify only events with eventType = "normal" are displayed
3. Verify tab count matches number of events shown
4. Expected: Filtered by event type correctly

**TC 9.2.3: Merchandise Events Tab**
1. Click "Merchandise" tab
2. Verify only events with eventType = "merchandise" are displayed
3. Verify merchandise details visible on cards
4. Expected: Merchandise events filtered correctly

**TC 9.2.4: Completed Events Tab**
1. Click "Completed" tab
2. Verify only past events are displayed (registrationDate < current date)
3. Verify attended status is shown (Attended: Yes/No)
4. Verify no "Unregister" button present
5. Expected: Past events displayed with attendance info

**TC 9.2.5: Cancelled Events Tab**
1. Click "Cancelled" tab
2. Expected: Empty state or cancelled events (if cancellation implemented)

**TC 9.2.6: Tab Counts**
1. Verify each tab displays correct event count in badge
2. Expected: Counts match filtered events

**TC 9.2.7: Unregister Functionality**
1. On "Upcoming" tab, click "Unregister" button on an event
2. Confirm the action
3. Verify event removed from list
4. Verify success message displayed
5. Expected: Successful unregistration from event

**TC 9.2.8: QR Code Display**
1. Verify each event card displays a QR code
2. Scan QR code with phone (should contain ticket ID)
3. Expected: QR code readable and contains ticket information

---

## 9.3 Browse Events Page [5 Marks]

### Test Cases:

**TC 9.3.1: Search Functionality - Partial Match**
1. Navigate to Browse Events
2. Enter partial event title in search box (e.g., "Tech" for "Tech Fest 2024")
3. Verify matching events displayed
4. Expected: Fuzzy matching shows relevant results

**TC 9.3.2: Search Functionality - Organizer Name**
1. Enter organizer email or name in search
2. Verify events by that organizer displayed
3. Expected: Search includes organizer information

**TC 9.3.3: Event Type Filter**
1. Select "Normal" from Event Type dropdown
2. Verify only normal events displayed
3. Select "Merchandise" 
4. Verify only merchandise events displayed
5. Expected: Type filter works correctly

**TC 9.3.4: Eligibility Filter**
1. Select "IIIT Participants Only" from Eligibility dropdown
2. Verify filtered results
3. Select "Open to All"
4. Verify filtered results
5. Expected: Eligibility filter working

**TC 9.3.5: Date Range Filter**
1. Select a "From" date
2. Select a "To" date
3. Verify only events within date range displayed
4. Expected: Date filtering accurate

**TC 9.3.6: Multiple Filters Combined**
1. Apply search term + event type + date range together
2. Verify results match all criteria
3. Expected: Multiple filters work in combination

**TC 9.3.7: Trending Events**
1. Click "Trending" button
2. Verify only events created in last 24 hours displayed
3. Verify sorted by registration count (highest first)
4. Verify maximum 5 events shown
5. Expected: Trending calculation correct

**TC 9.3.8: Clear Filters**
1. Apply multiple filters
2. Click "Clear Filters" button
3. Verify all filters reset and all events displayed
4. Expected: Filters cleared successfully

**TC 9.3.9: Registration Blocking - Deadline Passed**
1. Find event with past registration deadline
2. Verify registration button disabled or shows "Registration Closed"
3. Verify red text indicator
4. Expected: Cannot register after deadline

**TC 9.3.10: Registration Blocking - Capacity Full**
1. Find event with registeredCount >= capacity
2. Verify registration shows "Event Full"
3. Expected: Cannot register when full

**TC 9.3.11: Registration Blocking - Merchandise Out of Stock**
1. Find merchandise event with stockQuantity = 0
2. Verify shows "Out of Stock"
3. Expected: Cannot register when no stock

**TC 9.3.12: Event Details Navigation**
1. Click on event title or "View Details" button
2. Verify navigation to EventDetails page
3. Expected: Correct routing to event detail view

---

## 9.4 Event Details Page [2 Marks]

### Test Cases:

**TC 9.4.1: Complete Event Information Display**
1. Navigate to event details page (click event from browse)
2. Verify all fields displayed:
   - Title, description, event type badge
   - Event date, registration date, registration deadline
   - Location, fee, capacity
   - Eligibility criteria
   - Tags (if any)
   - Organizer information
   - Merchandise details (if applicable)
3. Expected: All event information visible

**TC 9.4.2: Registration Button - Available**
1. View event with open registration
2. Verify "Register" button is blue and clickable
3. Click button and verify custom form modal opens
4. Expected: Registration flow starts

**TC 9.4.3: Registration Button - Deadline Passed**
1. View event with past deadline
2. Verify button is disabled or shows "Registration Closed"
3. Verify red status indicator
4. Expected: Registration blocked with reason

**TC 9.4.4: Registration Button - Capacity Full**
1. View event at full capacity
2. Verify shows "Event Full"
3. Expected: Registration blocked

**TC 9.4.5: Registration Button - Stock Exhausted**
1. View merchandise event with no stock
2. Verify shows "Out of Stock"
3. Expected: Registration blocked

**TC 9.4.6: Custom Form Registration**
1. Click "Register" on event with custom form fields
2. Fill required custom fields
3. Submit form
4. Verify success message
5. Verify redirect to participant dashboard
6. Expected: Registration with custom form successful

**TC 9.4.7: Navigation**
1. Click "Back" button
2. Verify returns to previous page (browse events)
3. Expected: Navigation working correctly

---

## 9.5 Registration Workflows [5 Marks]
*Note: QR codes and custom forms implemented in Section 8, email functionality pending*

### Test Cases:

**TC 9.5.1: QR Code Generation**
1. Register for an event
2. Navigate to participant dashboard
3. Verify QR code displayed on event card
4. Expected: Unique QR code generated per registration

**TC 9.5.2: Ticket ID Assignment**
1. After registration, check event card
2. Verify unique ticket ID displayed (format: REG-timestamp-random)
3. Expected: Ticket ID visible and unique

**TC 9.5.3: Custom Form Submission**
1. Register for event with custom form fields
2. Verify form responses saved
3. Backend: Check registration document has customFormResponses array
4. Expected: Custom data captured correctly

**TC 9.5.4: Stock Management (Merchandise)**
1. Note current stock quantity of merchandise event
2. Register for the event
3. Backend: Verify stockQuantity decremented by 1
4. Expected: Stock reduced after purchase
*Note: This feature may need implementation*

**TC 9.5.5: Email Ticket Delivery**
1. Register for an event
2. Check email inbox for ticket email
3. Verify email contains: event details, ticket ID, QR code attachment
4. Expected: Email delivered with all information
*Note: This feature requires nodemailer implementation*

---

## 9.6 Profile Page [2 Marks]

### Test Cases:

**TC 9.6.1: Editable Participant Fields**
1. Login as participant
2. Navigate to Profile > Account tab
3. Edit: firstName, lastName, collegeOrgName, contactNumber
4. Click "Save Changes"
5. Refresh page and verify changes persisted
6. Expected: Profile fields editable and saved

**TC 9.6.2: Editable Organizer Fields**
1. Login as organizer
2. Navigate to Profile > Account tab
3. Edit: organizerName, category, description
4. Click "Save Changes"
5. Verify changes saved
6. Expected: Organizer profile editable

**TC 9.6.3: Contact Number Validation**
1. Enter invalid contact number (not 10 digits)
2. Try to save
3. Verify error message displayed
4. Expected: Validation prevents invalid data

**TC 9.6.4: Interests Selection (Participant)**
1. Navigate to Profile > Preferences tab
2. Select/deselect interests from available options
3. Click "Save Preferences"
4. Verify success message
5. Refresh and verify selections persisted
6. Expected: Interests saved correctly

**TC 9.6.5: Follow Organizers (Participant)**
1. In Preferences tab, view organizer list
2. Check/uncheck organizers to follow
3. Click "Save Preferences"
4. Verify selections saved
5. Expected: Followed organizers updated

**TC 9.6.6: Password Change**
1. Navigate to Profile > Security tab
2. Enter current password, new password, confirm password
3. Click "Change Password"
4. Verify success message
5. Logout and login with new password
6. Expected: Password updated successfully

**TC 9.6.7: Password Validation - Mismatch**
1. In Security tab, enter different values for new password and confirm
2. Try to submit
3. Verify error: "New passwords do not match"
4. Expected: Validation prevents mismatch

**TC 9.6.8: Password Validation - Minimum Length**
1. Enter new password with < 6 characters
2. Try to submit
3. Verify error about minimum length
4. Expected: Validation enforces length requirement

**TC 9.6.9: Password Validation - Incorrect Current**
1. Enter wrong current password
2. Try to change
3. Verify error: "Current password is incorrect"
4. Expected: Current password verified before change

---

## 9.7 Clubs/Organizers Listing [1 Mark]

### Test Cases:

**TC 9.7.1: List All Organizers**
1. Navigate to Clubs/Organizers page
2. Verify all approved organizers displayed
3. Verify each card shows: organizerName, category badge, description, email
4. Expected: Complete list of organizers

**TC 9.7.2: Follow Organizer**
1. Find organizer not yet followed
2. Click "+ Follow" button (blue)
3. Verify button changes to "✓ Following" (gray)
4. Verify success message displayed
5. Expected: Follow action successful

**TC 9.7.3: Unfollow Organizer**
1. Find organizer currently followed
2. Click "✓ Following" button
3. Verify button changes back to "+ Follow"
4. Verify success message displayed
5. Expected: Unfollow action successful

**TC 9.7.4: Follow Status Persistence**
1. Follow an organizer
2. Navigate away and return to Clubs page
3. Verify organizer still shows as followed
4. Expected: Follow status persists

**TC 9.7.5: Organizer Detail Navigation**
1. Click on organizer name/card
2. Verify navigation to OrganizerDetail page
3. Expected: Routing to detail page works

---

## 9.8 Organizer Detail Page [1 Mark]

### Test Cases:

**TC 9.8.1: Organizer Information Display**
1. Navigate to organizer detail page
2. Verify displayed information:
   - Organizer name
   - Category badge
   - Description
   - Contact email
3. Expected: All organizer info visible

**TC 9.8.2: Upcoming Events Tab**
1. View "Upcoming Events" tab (default)
2. Verify only future events displayed (eventDate >= current date)
3. Verify tab count badge shows correct number
4. Verify each event shows: title, type badge, description, date, location, fee, capacity
5. Expected: Future events listed correctly

**TC 9.8.3: Past Events Tab**
1. Click "Past Events" tab
2. Verify only past events displayed (eventDate < current date)
3. Verify tab count correct
4. Expected: Past events separated correctly

**TC 9.8.4: Event Navigation**
1. Click on event title or "View Details"
2. Verify navigation to EventDetails page for that event
3. Expected: Can view event details from organizer page

**TC 9.8.5: Back Navigation**
1. Click "Back to Clubs" button
2. Verify returns to ClubsOrganizers listing
3. Expected: Navigation working

---

## Backend API Validation

### Organizer Endpoints:

**API 9.1: GET /api/organizer**
```bash
curl -X GET http://localhost:5000/api/organizer
```
Expected: Array of all organizers with name, category, description, email

**API 9.2: GET /api/organizer/followed**
```bash
curl -X GET http://localhost:5000/api/organizer/followed \
  -H "Authorization: Bearer <participant_token>"
```
Expected: Array of organizers the user follows

**API 9.3: GET /api/organizer/:id**
```bash
curl -X GET http://localhost:5000/api/organizer/<organizer_id>
```
Expected: Organizer object with upcomingEvents and pastEvents arrays

**API 9.4: POST /api/organizer/:id/follow**
```bash
curl -X POST http://localhost:5000/api/organizer/<organizer_id>/follow \
  -H "Authorization: Bearer <participant_token>"
```
Expected: Success message, organizer added to user.followedOrganizers

**API 9.5: DELETE /api/organizer/:id/follow**
```bash
curl -X DELETE http://localhost:5000/api/organizer/<organizer_id>/follow \
  -H "Authorization: Bearer <participant_token>"
```
Expected: Success message, organizer removed from followedOrganizers

**API 9.6: GET /api/events/public/:id**
```bash
curl -X GET http://localhost:5000/api/events/public/<event_id>
```
Expected: Event object without authentication (for public browsing)

**API 9.7: POST /api/auth/change-password**
```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"old123","newPassword":"new123"}'
```
Expected: Success message after password validation and update

---

## Database Verification

### Check User Follow Relationships:
```javascript
db.users.findOne({ email: "participant@example.com" }, { followedOrganizers: 1 })
```
Expected: Array of ObjectIds of followed organizers

### Check Registration with Custom Form:
```javascript
db.registrations.findOne({ participantId: ObjectId("...") }, { customFormResponses: 1 })
```
Expected: customFormResponses array with user-submitted data

### Verify Event Capacity:
```javascript
db.events.findOne({ _id: ObjectId("...") }, { registeredCount: 1, capacity: 1 })
```
Expected: registeredCount increments after registration, should not exceed capacity

### Check Merchandise Stock:
```javascript
db.events.findOne(
  { eventType: "merchandise" },
  { "merchandiseDetails.stockQuantity": 1 }
)
```
Expected: Stock quantity decrements after registration (if implemented)

---

## Completion Checklist [22 Marks]

### Navigation Menu [1 Mark]
- [ ] Participant links working (Dashboard, Browse, Clubs, Profile, Logout)
- [ ] Organizer links working (Dashboard, Create Event, Profile, Logout)
- [ ] Admin links working (Dashboard, Profile, Logout)

### My Events Dashboard [6 Marks]
- [ ] Upcoming events tab shows future events
- [ ] Normal events tab filters by type
- [ ] Merchandise events tab filters by type
- [ ] Completed events tab shows past events with attendance
- [ ] Cancelled events tab implemented
- [ ] Tab counts accurate
- [ ] QR codes displayed on all events
- [ ] Ticket IDs visible
- [ ] Unregister button on upcoming tab only
- [ ] Unregister functionality working

### Browse Events Page [5 Marks]
- [ ] Search works on event title/description/organizer
- [ ] Fuzzy/partial matching functional
- [ ] Trending shows top 5 from last 24 hours
- [ ] Event type filter working
- [ ] Eligibility filter working
- [ ] Date range filter working
- [ ] Multiple filters work together
- [ ] Clear filters button resets all
- [ ] Registration blocked for past deadline
- [ ] Registration blocked when capacity full
- [ ] Registration blocked when stock = 0
- [ ] Event count displays correctly

### Event Details Page [2 Marks]
- [ ] All event information displayed
- [ ] Event type badge shown
- [ ] Registration button validates deadline/capacity/stock
- [ ] Custom form modal opens for registration
- [ ] Success message after registration
- [ ] Redirect to dashboard after registration

### Registration Workflows [5 Marks]
- [ ] Unique ticket IDs generated
- [ ] QR codes generated per registration
- [ ] Custom form responses saved
- [ ] Stock management for merchandise (pending implementation)
- [ ] Email tickets sent (pending implementation)

### Profile Page [2 Marks]
- [ ] Editable fields work (name, contact, college, interests)
- [ ] Contact number validation (10 digits)
- [ ] Password change functional
- [ ] Password validation (length, match, current password check)
- [ ] Interests selection saved (participant)
- [ ] Followed organizers saved (participant)

### Clubs/Organizers Listing [1 Mark]
- [ ] All organizers listed
- [ ] Organizer cards show name, category, description, email
- [ ] Follow/unfollow buttons working
- [ ] Follow status persists
- [ ] Navigation to detail page working

### Organizer Detail Page [1 Mark]
- [ ] Organizer info displayed (name, category, description, email)
- [ ] Upcoming events tab shows future events
- [ ] Past events tab shows past events
- [ ] Tab counts accurate
- [ ] Event cards navigable to details

---

## Known Issues / Pending Features

1. **Email Functionality**: Ticket emails not yet implemented (requires nodemailer setup)
2. **Merchandise Stock Decrement**: Stock quantity may not decrement on purchase (needs verification)
3. **Followed Clubs Filter**: UI toggle exists in Browse Events but filtering logic not implemented
4. **Event Cancellation**: Cancelled tab exists but cancellation workflow not implemented

---

## Testing Priority

**CRITICAL (Must Pass):**
- All navigation links functional
- Dashboard tabs filter correctly
- Browse events search and filters working
- Registration blocking for deadline/capacity/stock
- Profile password change working

**HIGH (Important):**
- QR codes displaying
- Custom form submissions saving
- Follow/unfollow functionality
- Organizer detail page event split (upcoming/past)

**MEDIUM (Nice to Have):**
- Email ticket delivery
- Merchandise stock decrement
- Followed clubs filter

---

## Success Criteria

Section 9 is considered complete when:
1. All 22 marks' worth of features are functional
2. All CRITICAL test cases pass
3. No blocking bugs in user flows
4. API endpoints return correct data
5. Database updates reflect user actions
6. UI matches specifications (tabs, filters, search, etc.)

---

**Validation Date:** ___________
**Tested By:** ___________
**Status:** ___________
