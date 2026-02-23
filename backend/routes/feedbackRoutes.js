const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  submitFeedback,
  getEventFeedback,
  getMyFeedback,
} = require("../controllers/feedbackController");

router.post(
  "/:eventId",
  protect,
  authorize("participant"),
  submitFeedback
);

router.get(
  "/:eventId",
  protect,
  authorize("organizer"),
  getEventFeedback
);

router.get(
  "/:eventId/mine",
  protect,
  authorize("participant"),
  getMyFeedback
);

module.exports = router;
