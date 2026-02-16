const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getPreferences,
  updatePreferences,
  skipPreferences,
  getRecommendedEvents,
  getAvailableInterests,
  getAvailableOrganizers,
} = require("../controllers/preferencesController");

// Get available interests and organizers (for onboarding UI)
router.get("/interests", protect, getAvailableInterests);
router.get("/organizers", protect, getAvailableOrganizers);

// Participant preference endpoints
router.get("/", protect, authorize("participant"), getPreferences);
router.post("/update", protect, authorize("participant"), updatePreferences);
router.post("/skip", protect, authorize("participant"), skipPreferences);
router.get(
  "/recommended-events",
  protect,
  authorize("participant"),
  getRecommendedEvents
);

module.exports = router;
