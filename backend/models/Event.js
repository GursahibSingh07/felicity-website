const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
    },

    date: {
      type: Date,
      required: [true, "Event date is required"],
    },

    location: {
      type: String,
      required: [true, "Event location is required"],
    },

    capacity: {
      type: Number,
      required: [true, "Event capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    
    registeredCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
