const mongoose = require("mongoose");

const discussionMessageSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscussionMessage",
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isAnnouncement: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

discussionMessageSchema.index({ event: 1, createdAt: -1 });
discussionMessageSchema.index({ parentMessage: 1 });

module.exports = mongoose.model("DiscussionMessage", discussionMessageSchema);
