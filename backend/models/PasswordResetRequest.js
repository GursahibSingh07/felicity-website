const mongoose = require("mongoose");

const passwordResetRequestSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminComment: {
      type: String,
      default: "",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    generatedPassword: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

passwordResetRequestSchema.index({ organizer: 1, status: 1 });

module.exports = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
