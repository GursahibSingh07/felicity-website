const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMessages,
  postMessage,
  deleteMessage,
  pinMessage,
  reactToMessage,
  getUnreadCount,
} = require("../controllers/discussionController");

router.get(
  "/:eventId",
  protect,
  authorize("participant", "organizer"),
  getMessages
);

router.post(
  "/:eventId",
  protect,
  authorize("participant", "organizer"),
  postMessage
);

router.patch(
  "/message/:messageId/delete",
  protect,
  authorize("participant", "organizer"),
  deleteMessage
);

router.patch(
  "/message/:messageId/pin",
  protect,
  authorize("organizer"),
  pinMessage
);

router.post(
  "/message/:messageId/react",
  protect,
  authorize("participant", "organizer"),
  reactToMessage
);

router.get(
  "/:eventId/unread",
  protect,
  authorize("participant", "organizer"),
  getUnreadCount
);

module.exports = router;
