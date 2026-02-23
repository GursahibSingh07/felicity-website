# Section 16: Anonymous Feedback System - Validation

## Files Created
- `backend/models/Feedback.js` — Schema with event, user, rating (1-5), comment (max 1000 chars); unique compound index on event+user
- `backend/controllers/feedbackController.js` — submitFeedback (with attendance check, upsert), getEventFeedback (aggregated stats, distribution, filter by rating), getMyFeedback
- `backend/routes/feedbackRoutes.js` — 3 routes: POST submit (participant), GET event feedback (organizer), GET my feedback (participant)

## Files Modified
- `backend/server.js` — Registered feedback routes at /api/feedback
- `frontend/src/pages/ParticipantDashboard.jsx` — Added "Rate this Event" button on attended events, feedback modal with interactive star rating, comment textarea, anonymous indicator, edit support
- `frontend/src/pages/OrganizerEventDetail.jsx` — Added "Feedback" tab with Google Play-style rating overview (large average, star distribution bars), filter by star rating, individual review cards

---

## Anonymous Feedback System [2 Marks]

### Test Case 1: Only Attended Participants Can Submit Feedback
1. Log in as participant
2. Go to Participant Dashboard → Completed tab
3. Find an event where attended = Yes → "⭐ Rate this Event" button visible
4. Find an event where attended = No → no feedback button
5. Verify upcoming events do NOT show the feedback button

### Test Case 2: Submit Star Rating and Comment
1. Click "⭐ Rate this Event" on an attended event
2. Verify modal opens with event title, 5 interactive stars, comment textarea
3. Hover over stars → stars light up on hover
4. Click 4th star → 4 stars highlighted, label says "Good"
5. Type a comment (optional)
6. Click "Submit" → success message "Feedback submitted"
7. Modal auto-closes after 1.5 seconds

### Test Case 3: Star Rating Labels
1. Open feedback modal
2. Click star 1 → label shows "Terrible"
3. Click star 2 → "Poor"
4. Click star 3 → "Average"
5. Click star 4 → "Good"
6. Click star 5 → "Excellent"
7. No star selected → "Tap a star to rate"

### Test Case 4: Anonymous Feedback Indicator
1. Open feedback modal
2. Verify message: "🔒 Your feedback is anonymous — organizers cannot see your identity."
3. Submit feedback
4. Log in as organizer → verify feedback does NOT show participant name/email

### Test Case 5: Edit Existing Feedback
1. After submitting feedback, the button changes to "✓ Edit Feedback" (gray)
2. Click it → modal opens pre-filled with previous rating and comment
3. Change rating and comment
4. Submit → "Feedback updated" message

### Test Case 6: Cannot Submit Without Rating
1. Open feedback modal
2. Leave stars at 0, click Submit
3. Verify error: "Please select a rating"

### Test Case 7: One Feedback Per Event
1. Backend enforces unique index on event+user
2. Submitting again updates existing feedback (upsert behavior)

### Test Case 8: Organizer Views Google Play-Style Feedback
1. Log in as organizer
2. Open event detail page → click "Feedback" tab
3. Verify Google Play-style layout:
   - Large average rating number (e.g. "4.2")
   - 5 filled/unfilled stars next to average
   - "X reviews" count label
   - Star distribution bars (5 → 1) with counts
4. Verify bar widths are proportional to count

### Test Case 9: Filter Feedback by Rating
1. In the Feedback tab, click on a star row (e.g. "5 ★" bar)
2. Verify only 5-star reviews are shown below
3. Verify "Filtering by 5 stars" label with clear button
4. Click same bar again or "✕ Clear" → filter removed, all reviews shown

### Test Case 10: Individual Review Cards
1. Each review shows: star rating (filled stars), date, comment text
2. No user identity is shown (anonymous)
3. Reviews without comments show stars and date only

### Test Case 11: Empty Feedback State
1. Open Feedback tab for an event with no feedback
2. Verify message: "No feedback received yet"
3. Filter by a rating with no entries → "No reviews with this rating"

### Test Case 12: Character Limit
1. Open feedback modal
2. Type in comment textarea → character counter shows "X/1000"
3. Cannot exceed 1000 characters (maxLength enforced)

---

## API Endpoint Tests

| Method | Endpoint | Auth | Expected |
|--------|----------|------|----------|
| POST | `/api/feedback/:eventId` | Participant | Submit/update feedback (rating 1-5, comment); must have attended the event |
| GET | `/api/feedback/:eventId` | Organizer (owner) | Get all feedback with stats (average, distribution); optional ?rating= filter |
| GET | `/api/feedback/:eventId/mine` | Participant | Get own feedback for an event (or null) |
