# Section 10: Organizer Features & Navigation - Validation Guide [18 Marks]

## Overview
This document provides step-by-step validation procedures for all organizer-facing features implemented in Section 10.

---

## 10.1 Navigation Menu [1 Mark]

### Test Cases:

**TC 10.1.1: Organizer Navbar Links**
1. Login as an organizer user
2. Verify navbar displays: Dashboard, Ongoing Events, Create Event, Profile, Logout
3. Click "Ongoing Events" link
4. Expected: Navigates to `/organizer/ongoing`

**TC 10.1.2: Ongoing Events Navigation**
1. From navbar, click "Ongoing Events"
2. Verify the OngoingEvents page loads
3. Verify only events with status "ongoing" are displayed
4. Expected: Correct route `/organizer/ongoing` renders OngoingEvents page

---

## 10.2 Organizer Dashboard [3 Marks]

### Test Cases:

**TC 10.2.1: Summary Stats Row**
1. Login as an organizer and navigate to `/organizer/dashboard`
2. Verify 5 summary stat cards are displayed:
   - Total Events
   - Total Registrations
   - Total Revenue (₹)
   - Ongoing Events
   - Attendance Rate (%)
3. Verify values are computed correctly from all events
4. Expected: All 5 stat cards present with correct values

**TC 10.2.2: Status Filter Pills**
1. On dashboard, verify filter pills: all / draft / published / ongoing / completed / closed / cancelled
2. Each pill shows count in parentheses — e.g., "published (3)"
3. Click "draft" pill — verify only draft events shown
4. Click "ongoing" pill — verify only ongoing events shown
5. Click "all" pill — verify all events shown
6. Expected: Status filter pills work correctly and counts are accurate

**TC 10.2.3: Event Cards Grid Layout**
1. Verify events display as cards in a responsive grid (minmax 320px)
2. Each card must show: title, StatusBadge (colored), type badge, start/end date, location, capacity + registered count, revenue, action buttons
3. Expected: Card layout with all required information

**TC 10.2.4: StatusBadge Colors**
1. Verify each status has a distinct colored badge:
   - Draft: gray
   - Published: light blue
   - Ongoing: green
   - Completed: dark green
   - Closed: red-tinted
   - Cancelled: red-tinted
2. Expected: Color-coded status badges on all cards

**TC 10.2.5: Action Buttons Per Status**
1. On a **Draft** event card: verify buttons Edit, Publish, Cancel, Delete
2. On a **Published** event card: verify buttons Edit, Mark Ongoing, Close Reg, Unpublish, Cancel, Delete
3. On an **Ongoing** event card: verify buttons Mark Completed, Close, Cancel, Delete
4. On a **Completed/Closed** event card: verify only Delete button
5. On a **Cancelled** event card: verify only Delete button
6. Expected: Context-sensitive action buttons per status

**TC 10.2.6: Status Transitions from Dashboard**
1. On a Draft event, click "Publish" — verify status badge changes to Published
2. On a Published event, click "Mark Ongoing" — verify status changes to Ongoing
3. On an Ongoing event, click "Mark Completed" — verify status changes to Completed
4. On a Published event, click "Unpublish" — verify status changes back to Draft
5. Expected: Status transitions update card in real-time without page reload

**TC 10.2.7: Completed Event Analytics Table**
1. When at least one event has status "completed" or "closed", verify an analytics table appears above the filter pills
2. Table columns: Event (linked), Type, Registrations, Attended, Revenue, Attendance Rate
3. Click event link in the table — verify navigates to OrganizerEventDetail page
4. Expected: Analytics table shows with correct per-event data

**TC 10.2.8: View Details Button**
1. On any event card, click "View Details"
2. Verify navigation to `/organizer/events/:id`
3. Expected: Routes to OrganizerEventDetail page for that event

**TC 10.2.9: Delete Event**
1. Click "Delete" on an event card
2. Confirm the dialog
3. Verify event removed from the list
4. Expected: Event deleted, removed from dashboard immediately

**TC 10.2.10: Cancel Event**
1. Click "Cancel" on a non-cancelled, non-terminal event
2. Confirm the dialog
3. Verify event status changes to "cancelled" (status badge turns red)
4. Expected: Event cancelled, badge updated, Cancel button no longer shown

---

## 10.3 Event Detail Page - Organizer View [4 Marks]

### Test Cases:

**TC 10.3.1: Page Load and Header**
1. From dashboard, click "View Details" on any event
2. Verify page loads at `/organizer/events/:id`
3. Verify event title, status badge, and event type badge are shown in the header
4. Verify "Edit Event" button is present in header
5. Verify "← Back to Dashboard" button is present
6. Expected: Full header with event metadata and navigation

**TC 10.3.2: Overview Tab - All Fields**
1. Click "Overview" tab (default)
2. Verify the following info cards are displayed:
   - Description
   - Start Date (formatted)
   - End Date
   - Registration Deadline
   - Location
   - Capacity
   - Eligibility
   - Registration Fee (₹X or Free)
   - Tags
3. Expected: All event fields displayed in info card grid

**TC 10.3.3: Analytics Tab - Stat Cards**
1. Click "Analytics" tab
2. Verify 4 stat cards: Total Registrations, Attended, Revenue (₹), Attendance Rate (%)
3. Verify Registration Fill Rate progress bar is displayed
4. Bar percentage should equal (registrations / capacity) × 100
5. Expected: Analytics stats and progress bar are accurate

**TC 10.3.4: Participants Tab - Table**
1. Click "Participants" tab
2. Verify table with columns: Name, Email, Registration Date, Ticket ID, Attended (badge), Action
3. Verify each participant row has correct data
4. Verify Attended column shows green "Yes" or red "No" badge
5. Expected: Full participant table rendered

**TC 10.3.5: Participants Tab - Search**
1. In search box, type part of a participant's name
2. Verify table filters to only matching rows
3. Clear the search — verify all participants shown
4. Type part of an email — verify matches
5. Expected: Real-time search filters by name or email

**TC 10.3.6: Participants Tab - Attended Filter**
1. Select "Attended" from dropdown filter
2. Verify only attended participants shown
3. Select "Not Attended"
4. Verify only non-attended participants shown
5. Select "All Participants"
6. Verify all shown
7. Expected: Attended filter works correctly

**TC 10.3.7: Mark Attended**
1. Find a participant with "No" attended badge
2. Click "Mark Attended" button
3. Verify the badge changes to green "Yes"
4. Verify "Mark Attended" button disappears from that row
5. Expected: Attendance marking updates in real-time

**TC 10.3.8: Export CSV**
1. Click "Export CSV" button
2. Verify a CSV file downloads named `{event_title}_participants.csv`
3. Open the CSV file and verify columns: Name, Email, Registration Date, Ticket ID, Attended
4. Verify all current participants are included
5. Expected: CSV downloads with correct data and headers

**TC 10.3.9: Participant Count Display**
1. Below the table, verify text: "Showing X of Y participants"
2. Apply search/filter and verify X updates while Y stays at total
3. Expected: Live count reflects filtering

---

## 10.4 Event Creation & Editing [4 Marks]

### Test Cases:

**TC 10.4.1: Create Event - Draft Default**
1. Navigate to `/organizer/create`
2. Fill all required fields and submit with status = "draft"
3. Verify event appears on dashboard with Draft badge
4. Expected: Event created as draft, no Discord webhook triggered

**TC 10.4.2: Create Event - Published + Discord Webhook**
1. Go to Profile, set a valid Discord webhook URL and save
2. Navigate to `/organizer/create`
3. Fill all fields, set status to "Published"
4. Submit the form
5. Check your Discord channel — verify an embed was posted with event title, description, date, location, fee, capacity
6. Expected: Event created and Discord notification sent automatically

**TC 10.4.3: EditEvent - Draft Allows Full Editing**
1. Click "Edit" on a Draft event
2. Verify all fields are editable: title, description, type, dates, location, eligibility, capacity, fee, tags
3. Verify custom form builder is fully interactive (add/remove/reorder fields)
4. Verify status selector shows Draft/Published
5. Change multiple fields and save
6. Verify changes persisted on dashboard
7. Expected: Full editing enabled for draft events

**TC 10.4.4: EditEvent - Published Restricted Editing**
1. Click "Edit" on a Published event
2. Verify status indicator says "Limited edits: description, deadline extension, capacity increase only"
3. Verify the following fields are grayed out (read-only): title, event type, start date, end date, location, eligibility, fee, tags
4. Verify description textbox IS editable
5. Verify registration deadline IS editable
6. Verify capacity IS editable but only allows increases
7. Try to decrease capacity — verify error message "Cannot reduce capacity after publishing"
8. Expected: Published events have restricted editing

**TC 10.4.5: EditEvent - Locked Status**
1. Click "Edit" on an Ongoing, Completed, Closed, or Cancelled event
2. Verify a message is displayed: "This event cannot be edited in its current status"
3. Verify form is NOT shown
4. Verify "Go to Dashboard" button is present
5. Expected: Locked statuses prevent editing entirely

**TC 10.4.6: Custom Form - Locked When Registrations Exist**
1. Edit a draft event that has at least one registration
2. Verify the custom form section shows "Locked (registrations exist)" badge
3. Verify Add Field button is hidden
4. Verify all form field inputs are disabled
5. Verify reorder (↑↓) buttons are disabled
6. Verify Remove (✕) buttons are disabled
7. Expected: Custom form is completely locked once registrations exist

**TC 10.4.7: Custom Form - Field Reordering**
1. Edit a draft event with no registrations
2. Add 3 or more custom form fields
3. Use ↑ and ↓ arrows to reorder fields
4. Verify fields swap positions in real-time
5. Save the event and re-open edit view
6. Verify saved order persists
7. Expected: Field reordering works and persists

**TC 10.4.8: Custom Form - File Upload Field Type**
1. In a draft event's custom form builder, add a new field
2. Open the field type dropdown
3. Verify "File Upload" option is present
4. Select "File Upload"
5. Save the event
6. Expected: File upload field type available and saveable

---

## 10.5 Organizer Profile Page [4 Marks]

### Test Cases:

**TC 10.5.1: Discord Webhook Field Exists**
1. Login as organizer, navigate to Profile > Account tab
2. Verify a "Discord Webhook URL" input field is present below the Description field
3. Verify placeholder text: "https://discord.com/api/webhooks/..."
4. Verify helper text explaining the webhook auto-announce feature
5. Expected: Webhook field is visible with helpful description

**TC 10.5.2: Contact Email Field Exists**
1. On Profile > Account tab (organizer)
2. Verify a "Contact Email (public)" input field is present
3. Verify it is of type email
4. Verify placeholder: "Public contact email shown to participants"
5. Expected: Contact email field visible

**TC 10.5.3: Save Discord Webhook**
1. Enter a valid Discord webhook URL in the webhook field
2. Click "Save Changes"
3. Verify success message displayed
4. Refresh the page
5. Verify the webhook URL is still populated
6. Expected: Webhook URL saved and persisted to database

**TC 10.5.4: Save Contact Email**
1. Enter a valid email in the Contact Email field
2. Click "Save Changes"
3. Verify success message displayed
4. Refresh the page
5. Verify contact email persists
6. Expected: Contact email saved correctly

**TC 10.5.5: Existing Organizer Fields Still Work**
1. Edit organizerName, category, description
2. Click "Save Changes"
3. Verify all three fields saved alongside webhook and contactEmail
4. Expected: No regression on existing organizer profile fields

**TC 10.5.6: Discord Webhook Integration Test**
1. Set webhook URL in Profile and save
2. Create a new event with status = Published
3. Check Discord channel
4. Verify embed message contains: event title, description, date, location, fee, capacity
5. Expected: Discord embed sent on event publish

---

## Backend API Validation

### Organizer Event Endpoints:

**API 10.1: GET /api/events/my-events (with analytics)**
```bash
curl -X GET http://localhost:5000/api/events/my-events \
  -H "Authorization: Bearer <organizer_token>"
```
Expected: Array of events each with `registrationCount`, `attendedCount`, `revenue` fields

**API 10.2: GET /api/events/:id (organizer view)**
```bash
curl -X GET http://localhost:5000/api/events/<event_id> \
  -H "Authorization: Bearer <organizer_token>"
```
Expected: Event object + `attendees` array + `analytics` object + `hasRegistrations` boolean

Analytics object shape:
```json
{
  "totalRegistrations": 10,
  "attendedCount": 7,
  "revenue": 1500,
  "attendanceRate": 70
}
```

**API 10.3: PATCH /api/events/:id/status (transition)**
```bash
curl -X PATCH http://localhost:5000/api/events/<event_id>/status \
  -H "Authorization: Bearer <organizer_token>" \
  -H "Content-Type: application/json" \
  -d '{"newStatus": "ongoing"}'
```
Expected: `{ "status": "ongoing" }` — event status updated

**API 10.4: Invalid status transition**
```bash
curl -X PATCH http://localhost:5000/api/events/<event_id>/status \
  -H "Authorization: Bearer <organizer_token>" \
  -H "Content-Type: application/json" \
  -d '{"newStatus": "completed"}'
```
(When event is Draft — completed is not a valid transition from draft)
Expected: 400 error with message about invalid transition

**API 10.5: PATCH /api/events/:id/cancel**
```bash
curl -X PATCH http://localhost:5000/api/events/<event_id>/cancel \
  -H "Authorization: Bearer <organizer_token>"
```
Expected: Event status set to "cancelled", 200 response

**API 10.6: GET /api/events/:id/attendees**
```bash
curl -X GET http://localhost:5000/api/events/<event_id>/attendees \
  -H "Authorization: Bearer <organizer_token>"
```
Expected: Array of participant objects with `name`, `email`, `firstName`, `lastName`, `registrationDate`, `ticketId`, `attended`, `customFormResponses`

**API 10.7: PATCH /api/registrations/attend/:ticketId**
```bash
curl -X PATCH http://localhost:5000/api/registrations/attend/<ticket_id> \
  -H "Authorization: Bearer <organizer_token>"
```
Expected: Registration `attended` field set to true

**API 10.8: PUT /api/auth/profile (with webhook)**
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <organizer_token>" \
  -H "Content-Type: application/json" \
  -d '{"discordWebhook": "https://discord.com/api/webhooks/xxx/yyy", "contactEmail": "club@example.com"}'
```
Expected: User document updated with discordWebhook and contactEmail

**API 10.9: GET /api/auth/profile (returns webhook)**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <organizer_token>"
```
Expected: Response includes `discordWebhook` and `contactEmail` fields

---

## Database Verification

### Check Event Status Enum:
```javascript
db.events.distinct("status")
// Expected: ["draft", "published", "ongoing", "completed", "closed", "cancelled"]
```

### Check User Discord Webhook:
```javascript
db.users.findOne({ role: "organizer" }, { discordWebhook: 1, contactEmail: 1 })
// Expected: { discordWebhook: "https://...", contactEmail: "..." }
```

### Verify Analytics Computation:
```javascript
// Count registrations for an event
db.registrations.countDocuments({ eventId: ObjectId("<event_id>"), status: "registered" })
// Count attended
db.registrations.countDocuments({ eventId: ObjectId("<event_id>"), attended: true })
```

### Verify Status Transitions in DB:
```javascript
db.events.findOne({ _id: ObjectId("<event_id>") }, { status: 1, title: 1 })
// After transition API call, status should reflect the new value
```

---

## Completion Checklist [18 Marks]

### 10.1 Navigation Menu [1 Mark]
- [ ] "Ongoing Events" link appears in organizer navbar
- [ ] Link navigates to `/organizer/ongoing`
- [ ] OngoingEvents page renders at that route

### 10.2 Organizer Dashboard [3 Marks]
- [ ] 5 summary stat cards displayed (Total Events, Registrations, Revenue, Ongoing, Attendance Rate)
- [ ] Completed event analytics table appears when applicable
- [ ] Status filter pills work (all/draft/published/ongoing/completed/closed/cancelled)
- [ ] Event cards in responsive grid layout
- [ ] StatusBadge shows correct color per status
- [ ] Action buttons are context-sensitive per status
- [ ] Status transitions work (publish, mark ongoing, complete, unpublish, close)
- [ ] Cancel event works, status → cancelled
- [ ] Delete event removes card from list
- [ ] "View Details" links to OrganizerEventDetail

### 10.3 Event Detail Page (Organizer View) [4 Marks]
- [ ] Page loads at `/organizer/events/:id`
- [ ] Overview tab shows all event fields
- [ ] Analytics tab shows 4 stat cards + fill rate progress bar
- [ ] Participants tab shows table with Name, Email, Date, Ticket ID, Attended, Action
- [ ] Search filters participants by name/email
- [ ] Attended filter (all/attended/not_attended) works
- [ ] "Mark Attended" button marks a participant, badge turns green, button disappears
- [ ] "Export CSV" downloads file with correct columns and data
- [ ] Participant count "Showing X of Y" updates with filter

### 10.4 Event Creation & Editing [4 Marks]
- [ ] Draft events: all fields fully editable
- [ ] Published events: only description, deadline, capacity (increase only) editable
- [ ] Ongoing/Completed/Closed/Cancelled events: read-only lock screen
- [ ] Custom form locked when registrations exist
- [ ] Custom form fields reorderable with ↑↓ buttons
- [ ] File Upload field type available in custom form
- [ ] Status selector shows only valid transitions in Edit form
- [ ] Discord webhook triggered on event creation with status = published

### 10.5 Organizer Profile [4 Marks]
- [ ] "Contact Email (public)" field present and saves correctly
- [ ] "Discord Webhook URL" field present and saves correctly
- [ ] Webhook URL persists after page refresh
- [ ] contactEmail persists after page refresh
- [ ] Existing fields (organizerName, category, description) still save correctly
- [ ] Discord webhook fires when new event is published (end-to-end test)

---

## Status Transition Rules Reference

| Current Status | Allowed Next Statuses |
|---|---|
| draft | published |
| published | draft, ongoing, closed |
| ongoing | completed, closed |
| completed | *(terminal — no transitions)* |
| closed | *(terminal — no transitions)* |
| cancelled | *(terminal — no transitions)* |

Note: Cancel (`/api/events/:id/cancel`) sets status to "cancelled" from any non-terminal status.

---

## Known Issues / Notes

1. **Discord Webhook**: Requires a valid Discord channel webhook URL. Test with a real Discord server or use a webhook testing tool like https://webhook.site.
2. **File Upload Field**: The `file` type is stored in the custom form schema. Frontend rendering of file upload inputs in the participant registration form may require additional implementation.
3. **hasRegistrations Flag**: Computed on the backend based on whether any active registrations exist for the event. This flag is returned in the `GET /api/events/:id` response.
4. **Attendance Rate**: Computed as `(attendedCount / totalRegistrations) × 100`. Shown as 0% when no registrations exist.

---

## Testing Priority

**CRITICAL (Must Pass):**
- Dashboard status filter pills work
- Status transitions via buttons (publish, ongoing, complete)
- OrganizerEventDetail tabs load correctly
- CSV export downloads with correct data
- EditEvent restricts fields for published events

**HIGH (Important):**
- Discord webhook posts on event publish
- Mark attended updates in real-time
- Custom form locked when registrations exist
- Profile saves discordWebhook and contactEmail

**MEDIUM (Nice to Have):**
- Analytics accuracy verification
- Field reordering persistence
- Fill rate progress bar accuracy

---

## Success Criteria

Section 10 is considered complete when:
1. All 18 marks' worth of features are functional
2. All CRITICAL test cases pass
3. Status machine transitions work correctly with validation
4. OrganizerEventDetail page shows all 3 tabs with full functionality
5. EditEvent enforces status-based editing rules
6. Profile saves and persists discord webhook + contactEmail

---

**Validation Date:** ___________
**Tested By:** ___________
**Status:** ___________
