const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const { getMyRegisteredEvents } = require("../controllers/registrationController");

router.get(
  "/my-events",
  protect,
  authorize("participant"),
  getMyRegisteredEvents
);

module.exports = router;
