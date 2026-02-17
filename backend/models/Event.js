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

    endDate: {
      type: Date,
      required: [true, "Event end date is required"],
    },

    location: {
      type: String,
      required: [true, "Event location is required"],
    },

    eligibility: {
      type: String,
      default: "All participants",
    },

    registrationFee: {
      type: Number,
      default: 0,
      min: [0, "Registration fee cannot be negative"],
    },

    tags: {
      type: [String],
      default: [],
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

    registrationDeadline: {
      type: Date,
      required: true,
    },

    eventType: {
      type: String,
      enum: ["normal", "merchandise"],
      required: [true, "Event type is required"],
      default: "normal",
    },

    customForm: {
      type: [{
        fieldName: String,
        fieldType: {
          type: String,
          enum: ["text", "email", "number", "textarea", "select", "radio", "checkbox"],
        },
        fieldLabel: String,
        required: Boolean,
        options: [String],
      }],
      default: [],
    },

    merchandiseDetails: {
      sizes: {
        type: [String],
        default: [],
      },
      colors: {
        type: [String],
        default: [],
      },
      variants: {
        type: [String],
        default: [],
      },
      stockQuantity: {
        type: Number,
        default: 0,
      },
      purchaseLimitPerParticipant: {
        type: Number,
        default: 1,
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Date validation
eventSchema.pre("save", function (next) {
  // Validate end date is after start date
  if (this.endDate && this.date && new Date(this.endDate) <= new Date(this.date)) {
    return next(new Error("Event end date must be after start date"));
  }

  // Validate registration deadline is before start date
  if (this.registrationDeadline && this.date && new Date(this.registrationDeadline) >= new Date(this.date)) {
    return next(new Error("Registration deadline must be before event start date"));
  }

  next();
});

// Validation for updates
eventSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  const updateData = update.$set || update;

  if (updateData.endDate && updateData.date) {
    if (new Date(updateData.endDate) <= new Date(updateData.date)) {
      return next(new Error("Event end date must be after start date"));
    }
  }

  if (updateData.registrationDeadline && updateData.date) {
    if (new Date(updateData.registrationDeadline) >= new Date(updateData.date)) {
      return next(new Error("Registration deadline must be before event start date"));
    }
  }

  next();
});

module.exports = mongoose.model("Event", eventSchema);
