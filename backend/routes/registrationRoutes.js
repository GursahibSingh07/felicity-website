const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMyRegisteredEvents,
  unregisterFromEvent,
  markAttendance,
} = require("../controllers/registrationController");

router.get(
  "/my-events",
  protect,
  authorize("participant"),
  getMyRegisteredEvents
);

router.delete(
  "/:eventId",
  protect,
  authorize("participant"),
  unregisterFromEvent
);

router.patch(
  "/attend/:ticketId",
  protect,
  authorize("organizer"),
  markAttendance
);


module.exports = router;
