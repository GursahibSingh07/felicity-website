const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  provisionFirstAdmin,
  createOrganizer,
  resetOrganizerPassword,
  getAllOrganizers,
  deleteOrganizer,
} = require("../controllers/adminController");

router.post("/provision-first-admin", provisionFirstAdmin);

router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({ message: "Admin dashboard" });
  }
);

router.post(
  "/create-organizer",
  protect,
  authorize("admin"),
  createOrganizer
);

router.get(
  "/organizers",
  protect,
  authorize("admin"),
  getAllOrganizers
);

router.post(
  "/reset-organizer-password",
  protect,
  authorize("admin"),
  resetOrganizerPassword
);

router.delete(
  "/organizers/:organizerId",
  protect,
  authorize("admin"),
  deleteOrganizer
);

module.exports = router;
