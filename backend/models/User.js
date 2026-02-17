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
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, 
  },
  areasOfInterest: {
    type: [String],
    default: [],
  },
  followedOrganizers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  preferencesComplete: {
    type: Boolean,
    default: false,
  },
  firstName: {
    type: String,
    default: "",
  },
  lastName: {
    type: String,
    default: "",
  },
  collegeOrgName: {
    type: String,
    default: "",
  },
  contactNumber: {
    type: String,
    default: "",
  },
  organizerName: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
