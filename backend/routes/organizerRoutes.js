const express = require("express");
const router = express.Router();

const {
  getAllOrganizers,
  getOrganizerById,
  followOrganizer,
  unfollowOrganizer,
  getFollowedOrganizers,
} = require("../controllers/organizerController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getAllOrganizers);

router.get("/followed", protect, authorize("participant"), getFollowedOrganizers);

router.get("/:id", getOrganizerById);

router.post("/:id/follow", protect, authorize("participant"), followOrganizer);

router.delete("/:id/follow", protect, authorize("participant"), unfollowOrganizer);

module.exports = router;
