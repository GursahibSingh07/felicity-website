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
  toggleOrganizerStatus,
  requestPasswordReset,
  getMyResetRequests,
  getAllResetRequests,
  approveResetRequest,
  rejectResetRequest,
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

router.patch(
  "/organizers/:organizerId/toggle",
  protect,
  authorize("admin"),
  toggleOrganizerStatus
);

router.delete(
  "/organizers/:organizerId",
  protect,
  authorize("admin"),
  deleteOrganizer
);

router.post(
  "/reset-request",
  protect,
  authorize("organizer"),
  requestPasswordReset
);

router.get(
  "/my-reset-requests",
  protect,
  authorize("organizer"),
  getMyResetRequests
);

router.get(
  "/reset-requests",
  protect,
  authorize("admin"),
  getAllResetRequests
);

router.patch(
  "/reset-requests/:requestId/approve",
  protect,
  authorize("admin"),
  approveResetRequest
);

router.patch(
  "/reset-requests/:requestId/reject",
  protect,
  authorize("admin"),
  rejectResetRequest
);

module.exports = router;
