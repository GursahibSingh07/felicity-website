const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.post(
  "/events",
  protect,
  authorize("organizer"),
  (req, res) => {
    res.json({ message: "Event created" });
  }
);

router.get(
  "/dashboard",
  protect,
  authorize("organizer"),
  (req, res) => {
    res.json({ message: "Organizer dashboard" });
  }
);

module.exports = router;
