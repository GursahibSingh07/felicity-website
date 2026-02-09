const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({ message: "Admin dashboard" });
  }
);

router.post(
  "/organizers",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({ message: "Organizer created" });
  }
);

module.exports = router;
