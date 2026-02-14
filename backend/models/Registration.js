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
  },
  { timestamps: true }
);

// Prevent duplicate registration for the same event by the same user
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
