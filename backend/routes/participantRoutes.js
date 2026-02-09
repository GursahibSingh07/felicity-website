const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get(
  "/dashboard",
  protect,
  authorize("participant"),
  (req, res) => {
    res.json({ message: "Participant dashboard" });
  }
);

router.get(
  "/events",
  protect,
  authorize("participant"),
  (req, res) => {
    res.json({ message: "Browse events" });
  }
);

module.exports = router;
