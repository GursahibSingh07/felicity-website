const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMyRegisteredEvents,
  unregisterFromEvent,
  markAttendance,
  validateTicket,
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

router.get(
  "/validate/:ticketId",
  protect,
  authorize("organizer"),
  validateTicket
);

module.exports = router;
