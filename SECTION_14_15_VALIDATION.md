# Section 14 & 15: Real-Time Discussion Forum + Organizer Password Reset Workflow - Validation

## Files Created
- `backend/models/DiscussionMessage.js` — Schema with event, author, content, parentMessage (threading), isPinned, isAnnouncement, reactions array, isDeleted, deletedBy
- `backend/models/PasswordResetRequest.js` — Schema with organizer, reason, status (pending/approved/rejected), adminComment, processedBy, processedAt, generatedPassword
- `backend/controllers/discussionController.js` — verifyEventAccess helper, getMessages, postMessage, deleteMessage, pinMessage, reactToMessage, getUnreadCount
- `backend/routes/discussionRoutes.js` — 6 routes for discussion CRUD with role-based access

## Files Modified
- `backend/controllers/adminController.js` — Added requestPasswordReset, getMyResetRequests, getAllResetRequests, approveResetRequest, rejectResetRequest; uses existing generatePassword helper
- `backend/routes/adminRoutes.js` — Added 5 new routes for password reset request workflow (organizer submit/view + admin list/approve/reject)
- `backend/server.js` — Registered discussion routes at /api/discussions
- `frontend/src/pages/EventDetails.jsx` — Added full discussion forum UI with threading, reactions, pinning, announcements, unread notifications, auto-refresh
- `frontend/src/pages/Profile.jsx` — Added "Password Reset" tab for organizers with request form and history
- `frontend/src/pages/ManageOrganizers.jsx` — Added password reset requests section with approve/reject actions, pending badge count, credentials display

---

## Real-Time Discussion Forum [6 Marks]

### Test Case 1: Access Control — Only Registered Participants and Event Organizer
1. Log in as a participant who is NOT registered for an event
2. Open the event details page
3. Click "Show Discussion"
4. Verify error message: access denied or "Not registered for this event"
5. Register for the event, then revisit
6. Verify discussion forum loads successfully

### Test Case 2: Post a Message
1. Log in as a registered participant
2. Open event details → click "Show Discussion"
3. Type a message in the textarea
4. Click "Post Message"
5. Verify message appears in the discussion list with author email and timestamp

### Test Case 3: Reply Threading
1. In the discussion forum, click "↩ Reply" on an existing message
2. Verify "Replying to a message" indicator appears above textarea
3. Type a reply and submit
4. Verify the reply appears nested under the parent message (indented)
5. Click "✕" to cancel reply → replying indicator disappears

### Test Case 4: Organizer Announcements
1. Log in as the event organizer
2. Open the event's discussion forum
3. Check "Mark as Announcement" checkbox
4. Post a message
5. Verify the message has yellow background, "ANNOUNCEMENT" badge, and left gold border
6. Verify participants cannot see the announcement checkbox

### Test Case 5: Organizer Pin/Unpin Messages
1. Log in as the event organizer
2. Click "📌 Pin" on any message
3. Verify message gets blue highlight, "📌 Pinned" label, and moves to top
4. Click "Unpin" on the pinned message
5. Verify pin styling and label removed
6. Verify participants do NOT see pin/unpin buttons

### Test Case 6: Message Deletion
1. As a participant, post a message
2. Click the 🗑 delete button on your own message
3. Verify message content changes to "[Message deleted]" in italic gray
4. As the event organizer, delete ANY participant's message
5. Verify it also shows "[Message deleted]"
6. Verify reaction buttons and reply disappear on deleted messages

### Test Case 7: Emoji Reactions
1. Click any emoji button (👍, ❤️, 😂, 🎉, 🤔, 👎) on a message
2. Verify the emoji button shows count "1" and gets blue border highlight
3. Click the same emoji again → reaction is removed (toggle behavior)
4. Have another user react → count increments

### Test Case 8: Unread Notification Badge
1. Note the last visit time for a discussion
2. Have another user post new messages
3. Return to the event details page
4. Verify a red "X new" badge appears next to "Show Discussion" button
5. Click "Show Discussion" → badge disappears
6. Close and reopen → badge should be 0

### Test Case 9: Auto-Refresh
1. Open discussion forum in two browser windows (different users)
2. Post a message in one window
3. Wait up to 10 seconds
4. Verify the message appears in the second window automatically

---

## Organizer Password Reset Workflow [6 Marks]

### Test Case 10: Organizer Submits Reset Request
1. Log in as an organizer
2. Go to Profile → "Password Reset" tab
3. Verify form with "Reason for Reset" textarea is shown
4. Submit without entering a reason → error "Please provide a reason"
5. Enter a reason and click "Submit Reset Request"
6. Verify success message "Password reset request submitted"
7. Verify the request appears in "Request History" with PENDING status

### Test Case 11: Duplicate Pending Request Prevention
1. As the same organizer, try submitting another reset request
2. Verify error: "You already have a pending reset request"
3. Verify only one pending request exists in history

### Test Case 12: Admin Views Reset Requests
1. Log in as admin
2. Go to Manage Clubs/Organizers page
3. Click "Password Reset Requests" button
4. Verify pending count badge shows on the button
5. Verify table shows organizer name, email, reason, status, date
6. Verify pending requests show Approve/Reject action buttons

### Test Case 13: Admin Approves Reset Request
1. In the reset requests table, click "Approve" on a pending request
2. Verify success message "Password reset approved!"
3. Verify new credentials card appears with organizer name, email, and auto-generated password
4. Verify the request status changes to APPROVED in the table
5. Verify Approve/Reject buttons are removed for processed requests

### Test Case 14: Organizer Sees Approved Result
1. Log back in as the organizer (using the NEW password)
2. Go to Profile → Password Reset tab
3. Verify the request in history shows APPROVED status
4. Verify admin comment (if any) is displayed
5. Verify "Processed" timestamp is shown

### Test Case 15: Admin Rejects Reset Request
1. As admin, click "Reject" on a pending request
2. Verify prompt appears for rejection reason
3. Enter a reason and confirm
4. Verify request status changes to REJECTED in the table
5. Verify the organizer sees REJECTED status with admin's comment in their history

### Test Case 16: Password Reset Request Status Colors
1. Verify PENDING requests show yellow/amber background
2. Verify APPROVED requests show green background
3. Verify REJECTED requests show red background
4. Status badges use matching colors (yellow, green, red)

### Test Case 17: Auto-Generated Password Strength
1. When admin approves a reset, verify the generated password:
   - Is at least 12 characters long
   - Contains uppercase letters
   - Contains lowercase letters
   - Contains numbers
   - Contains special characters

---

## API Endpoint Tests

### Discussion APIs
| Method | Endpoint | Auth | Expected |
|--------|----------|------|----------|
| GET | `/api/discussions/:eventId` | Participant/Organizer (registered/owner) | List messages with replies populated |
| POST | `/api/discussions/:eventId` | Participant/Organizer (registered/owner) | Create message; optional parentMessage for threading; organizer-only isAnnouncement |
| PATCH | `/api/discussions/message/:messageId/delete` | Author or Event Organizer | Soft delete (content replaced, isDeleted flag) |
| PATCH | `/api/discussions/message/:messageId/pin` | Event Organizer only | Toggle isPinned |
| POST | `/api/discussions/message/:messageId/react` | Participant/Organizer (registered/owner) | Toggle emoji reaction (add/remove) |
| GET | `/api/discussions/:eventId/unread?since=` | Participant/Organizer | Count of messages since given timestamp |

### Password Reset Request APIs
| Method | Endpoint | Auth | Expected |
|--------|----------|------|----------|
| POST | `/api/admin/reset-request` | Organizer | Submit password reset request with reason |
| GET | `/api/admin/my-reset-requests` | Organizer | Get own request history |
| GET | `/api/admin/reset-requests` | Admin | Get all requests with organizer details |
| PATCH | `/api/admin/reset-requests/:requestId/approve` | Admin | Approve request, auto-generate password, return credentials |
| PATCH | `/api/admin/reset-requests/:requestId/reject` | Admin | Reject request with comment |
