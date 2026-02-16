const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["participant", "organizer", "admin"],
    default: "participant",
  },
  userType: {
    type: String,
    enum: ["iiit-participant", "non-iiit-participant", "organizer", "admin"],
    required: true,
  },
  isRoleLocked: {
    type: Boolean,
    default: false, // Prevents role switching
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, 
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
