const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticketId: {
      type: String,
      unique: true,
      required: true,
    },
    attended: {
      type: Boolean,
      default: false,
    },
    attendedAt: {
      type: Date,
    },
    attendanceMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attendanceMethod: {
      type: String,
      enum: ["qr_scan", "manual_override"],
    },
    attendanceAuditLog: [
      {
        action: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: { type: Date, default: Date.now },
        reason: String,
      },
    ],
    customFormResponses: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paymentStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    paymentProof: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    merchandiseSelections: {
      size: String,
      color: String,
      variant: String,
      quantity: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);

registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
