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
  toggleEventStatus,
  getEventById,
  cancelEvent,
} = require("../controllers/eventController");

const { getAnalytics } = require("../controllers/eventController");


const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllEvents);
router.get("/public/:id", async (req, res) => {
  try {
    const Event = require("../models/Event");
    const event = await Event.findById(req.params.id).populate("createdBy", "email organizerName category");
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    if (event.status !== "published") {
      return res.status(403).json({ message: "Event is not published" });
    }
    
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Organizer routes
router.post("/", protect, authorize("organizer"), createEvent);

router.get("/my-events", protect, authorize("organizer"), getMyEvents);

router.put("/:id", protect, authorize("organizer"), updateEvent);

router.get("/:id", protect, authorize("organizer"), getEventById);

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

router.patch(
  "/:id/status",
  protect,
  authorize("organizer"),
  toggleEventStatus
);

router.patch(
  "/:id/cancel",
  protect,
  authorize("organizer"),
  cancelEvent
);

router.get(
  "/analytics",
  protect,
  authorize("admin"),
  getAnalytics
);



module.exports = router;
