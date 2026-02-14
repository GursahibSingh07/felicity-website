const express = require("express");
const router = express.Router();

const {
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getAllEvents,
  registerForEvent,
  getEventAttendees,
} = require("../controllers/eventController");


const { protect, authorize } = require("../middleware/authMiddleware");

// Public route - browse events
router.get("/", getAllEvents);

// Organizer routes
router.post("/", protect, authorize("organizer"), createEvent);

router.get("/my-events", protect, authorize("organizer"), getMyEvents);

router.put("/:id", protect, authorize("organizer"), updateEvent);

router.delete("/:id", protect, authorize("organizer"), deleteEvent);

// Participant route - register
router.post(
  "/:id/register",
  protect,
  authorize("participant"),
  registerForEvent
);

router.get(
  "/:id/attendees",
  protect,
  authorize("organizer"),
  getEventAttendees
);


module.exports = router;
