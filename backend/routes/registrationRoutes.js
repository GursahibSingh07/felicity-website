const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMyRegisteredEvents,
  unregisterFromEvent,
  markAttendance,
  validateTicket,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  scanQRAttendance,
  manualOverrideAttendance,
  getAttendanceDashboard,
  exportAttendanceCSV,
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

router.get(
  "/payments/pending/:eventId",
  protect,
  authorize("organizer"),
  getPendingPayments
);

router.patch(
  "/payments/approve/:registrationId",
  protect,
  authorize("organizer"),
  approvePayment
);

router.patch(
  "/payments/reject/:registrationId",
  protect,
  authorize("organizer"),
  rejectPayment
);

router.post(
  "/scan/:ticketId",
  protect,
  authorize("organizer"),
  scanQRAttendance
);

router.patch(
  "/manual-override/:registrationId",
  protect,
  authorize("organizer"),
  manualOverrideAttendance
);

router.get(
  "/attendance/:eventId",
  protect,
  authorize("organizer"),
  getAttendanceDashboard
);

router.get(
  "/attendance/:eventId/export",
  protect,
  authorize("organizer"),
  exportAttendanceCSV
);

module.exports = router;
