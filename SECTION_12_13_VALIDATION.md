# Section 12 & 13: Merchandise Payment Approval + QR Scanner & Attendance Tracking - Validation

## Files Modified
- `backend/models/Registration.js` — Added paymentStatus, paymentProof, rejectionReason, merchandiseSelections, attendedAt, attendanceMarkedBy, attendanceMethod, attendanceAuditLog fields
- `backend/controllers/registrationController.js` — Added getPendingPayments, approvePayment, rejectPayment, scanQRAttendance, manualOverrideAttendance, getAttendanceDashboard, exportAttendanceCSV; updated getMyRegisteredEvents to conditionally show QR
- `backend/controllers/eventController.js` — Updated registerForEvent for merchandise payment proof; updated getEventById & getEventAttendees with payment/attendance fields
- `backend/routes/registrationRoutes.js` — Added 7 new routes for payment and attendance APIs
- `frontend/src/pages/EventDetails.jsx` — Added merchandise selection fields and payment proof input in registration modal
- `frontend/src/pages/ParticipantDashboard.jsx` — Shows payment status badge, rejection reason, pending message; QR hidden while pending
- `frontend/src/pages/OrganizerEventDetail.jsx` — Added Payments tab (approve/reject with reason modal), payment summary stats, QR Scanner button
- `frontend/src/pages/QRScanner.jsx` — New page with camera QR scanner, manual ticket entry, live attendance dashboard, CSV export, manual override with audit logging
- `frontend/src/App.jsx` — Added QRScanner import and /organizer/scanner/:eventId route

## Frontend Dependency Added
- `html5-qrcode` — QR code scanning from device camera

---

## Merchandise Payment Approval Workflow [8 Marks]

### Test Case 1: Merchandise Registration Requires Payment Proof
1. Log in as participant
2. Browse events and open a merchandise event
3. Click "Register for this Event"
4. Verify merchandise selection fields appear (size, color, variant)
5. Verify payment proof field is required
6. Submit without payment proof → should show error
7. Enter payment proof URL and submit → should succeed with "pending approval" message

### Test Case 2: QR Code Hidden While Payment Pending
1. After registering for merchandise event with payment proof
2. Go to Participant Dashboard
3. Verify the merchandise event shows "Payment: Pending" badge
4. Verify QR code is NOT shown
5. Verify yellow info message about pending approval appears

### Test Case 3: Organizer Sees Payments Tab
1. Log in as organizer who owns a merchandise event
2. Navigate to event detail page
3. Verify "Payments" tab appears (only for merchandise events)
4. Verify badge shows pending payment count
5. Click Payments tab

### Test Case 4: Approve Payment
1. In the Payments tab, view pending payment list
2. Verify participant name, email, payment proof link, merchandise selections displayed
3. Click "View Payment Proof" — opens in new tab
4. Click "Approve" → payment removed from pending list
5. Verify stock quantity decremented in Event model
6. Verify participant now sees QR code on their dashboard

### Test Case 5: Reject Payment
1. In the Payments tab, click "Reject" on a pending payment
2. Verify rejection reason modal appears
3. Enter reason and confirm → payment removed from pending list
4. Verify participant sees "Payment: Rejected" badge and rejection reason on dashboard

### Test Case 6: Payment Status Summary
1. In the Payments tab, verify bottom section shows:
   - Pending count (yellow card)
   - Approved count (green card)
   - Rejected count (red card)

### Test Case 7: Cannot Approve When Out of Stock
1. Set merchandise stock to 0
2. Try to approve a pending payment
3. Should return error "Merchandise is out of stock"

### Test Case 8: Normal Event Registration Unchanged
1. Register for a normal event
2. Verify QR code shown immediately
3. Verify no payment-related fields or badges
4. Verify organizer event detail does NOT show Payments tab for normal events

---

## QR Scanner & Attendance Tracking [8 Marks]

### Test Case 9: QR Scanner Page Access
1. Log in as organizer
2. Navigate to event detail page
3. Click "QR Scanner" button
4. Verify scanner page loads with two tabs: "Scan QR" and "Attendance Dashboard"

### Test Case 10: Camera Scanner
1. On the Scan QR tab, click "Start Camera"
2. If camera available, verify viewfinder appears
3. Scan a valid QR code → "Attendance Marked!" success message with participant details
4. Click "Stop Camera" → camera stops

### Test Case 11: Manual Ticket Entry
1. On the Scan QR tab, enter a valid ticket ID manually
2. Click "Scan" → attendance marked with success message
3. Enter invalid ticket ID → error message "Invalid ticket - not found"

### Test Case 12: Duplicate Scan Rejection
1. Scan a ticket that has already been scanned
2. Verify 409 response with "Duplicate scan - attendance already marked"
3. Verify original scan timestamp and method shown in warning

### Test Case 13: Merchandise Payment Check on Scan
1. Try scanning a merchandise event ticket where payment is pending
2. Should return error "Payment not approved for this registration"
3. Approve the payment, then scan again → should succeed

### Test Case 14: Live Attendance Dashboard
1. Switch to "Attendance Dashboard" tab
2. Verify stats: Total Eligible, Attended, Not Yet, Attendance Rate
3. Verify progress bar updates as attendees are scanned
4. Verify "Attended" table shows name, email, ticket, scanned time, method
5. Verify "Not Yet Attended" table shows remaining participants

### Test Case 15: Manual Override with Audit Logging
1. In Attendance Dashboard, click "Mark Attended" on a not-attended participant
2. Verify modal appears requiring a reason
3. Enter reason and confirm → participant moves to attended list
4. Click "Unmark" on an attended participant
5. Verify modal appears, enter reason, confirm → participant moves back
6. Verify audit log records action, performer, timestamp, and reason

### Test Case 16: CSV Export from Scanner Page
1. On Attendance Dashboard, click "Export CSV"
2. Verify CSV downloads with columns: Name, Email, Contact, Ticket ID, Attended, Attended At, Method, Registration Date
3. Verify data matches the dashboard display

### Test Case 17: Event Authorization Check
1. Try accessing QR scanner for an event not owned by current organizer
2. Verify 403 "Not authorized" response on all endpoints

---

## API Endpoint Tests

### Payment APIs
| Method | Endpoint | Auth | Expected |
|--------|----------|------|----------|
| GET | `/api/registrations/payments/pending/:eventId` | Organizer (owner) | List of pending payments |
| PATCH | `/api/registrations/payments/approve/:registrationId` | Organizer (owner) | Approve payment, decrement stock |
| PATCH | `/api/registrations/payments/reject/:registrationId` | Organizer (owner) | Reject with reason |

### Attendance APIs
| Method | Endpoint | Auth | Expected |
|--------|----------|------|----------|
| POST | `/api/registrations/scan/:ticketId` | Organizer | Scan QR, mark attendance with timestamp |
| PATCH | `/api/registrations/manual-override/:registrationId` | Organizer (owner) | Manual mark/unmark with audit log |
| GET | `/api/registrations/attendance/:eventId` | Organizer (owner) | Live attendance dashboard data |
| GET | `/api/registrations/attendance/:eventId/export` | Organizer (owner) | CSV file download |

### Updated Endpoints
| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/api/events/:id/register` | Now accepts paymentProof + merchandiseSelections for merchandise events |
| GET | `/api/registrations/my-events` | Returns paymentStatus, hides QR if pending/rejected |
| GET | `/api/events/:id` (organizer) | Returns payment analytics (pending/approved/rejected counts) |
