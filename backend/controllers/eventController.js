const Event = require("../models/Event");
const Registration = require("../models/Registration");

// CREATE EVENT (Organizer Only)
exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET EVENTS
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.id });

    const Registration = require("../models/Registration");

    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const count = await Registration.countDocuments({
          event: event._id,
        });

        return {
          ...event.toObject(),
          registrationCount: count,
        };
      })
    );

    res.status(200).json(eventsWithCount);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE EVENT
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE EVENT
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const Registration = require("../models/Registration");
    await Registration.deleteMany({ event: event._id });

    await event.deleteOne();

    res.status(200).json({ message: "Event and related registrations deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PUBLISHED EVENTS
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: "published" }).populate(
      "createdBy",
      "email"
    );

    // Ensure eventType exists for all events (backwards compatibility)
    const eventsData = events.map(event => {
      const eventObj = event.toObject();
      if (!eventObj.eventType) {
        eventObj.eventType = "normal";
      }
      if (!eventObj.customForm) {
        eventObj.customForm = [];
      }
      return eventObj;
    });

    res.status(200).json(eventsData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REGISTER FOR EVENT (Participant)
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.status !== "published")
      return res.status(400).json({ message: "Event not published yet" });

    // Count existing registrations
    const currentCount = await Registration.countDocuments({
      event: event._id,
    });

    if (new Date() > new Date(event.registrationDeadline)) {
      return res
        .status(400)
        .json({ message: "Registration deadline passed" });
    }

    if (currentCount >= event.capacity)
      return res.status(400).json({ message: "Event is full" });

    // Validate custom form fields if event is normal type
    let customFormResponses = {};
    if (event.eventType === "normal" && event.customForm && event.customForm.length > 0) {
      customFormResponses = req.body.customFormResponses || {};
      
      // Check required fields
      for (const field of event.customForm) {
        if (field.required && !customFormResponses[field.fieldName]) {
          return res.status(400).json({ 
            message: `${field.fieldLabel} is required` 
          });
        }
      }
    }

    // Create registration
    const crypto = require("crypto");
    const QRCode = require("qrcode");

    const ticketId = crypto.randomBytes(6).toString("hex");

    const qrData = await QRCode.toDataURL(ticketId);

    const registration = await Registration.create({
      user: req.user.id,
      event: event._id,
      ticketId,
      customFormResponses,
    });


    res.status(201).json({
      message: "Registered successfully",
      ticketId,
      qrCode: qrData,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event" });
    }

    res.status(500).json({ message: error.message });
  }
};

// SEE REGISTRATIONS FOR AN EVENT (Organizer)
exports.getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    // Ensure organizer owns this event
    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const registrations = await Registration.find({
      event: event._id,
    }).populate("user", "email");

    const attendees = registrations.map((reg) => ({
      _id: reg.user._id,
      email: reg.user.email,
      ticketId: reg.ticketId,
      attended: reg.attended,
    }));
    res.status(200).json(attendees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.toggleEventStatus = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    event.status =
      event.status === "draft" ? "published" : "draft";

    await event.save();

    res.status(200).json(event);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    // Ensure eventType exists (for backwards compatibility with old events)
    const eventData = event.toObject();
    if (!eventData.eventType) {
      eventData.eventType = "normal";
    }
    if (!eventData.customForm) {
      eventData.customForm = [];
    }

    res.status(200).json(eventData);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* Unneeded code
exports.markAttendance = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      ticketId: req.params.ticketId,
    });

    if (!registration)
      return res.status(404).json({ message: "Ticket not found" });

    registration.attended = true;
    await registration.save();

    res.status(200).json({ message: "Attendance marked" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
*/

exports.getAnalytics = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      totalEvents,
      totalRegistrations,
      totalUsers,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

