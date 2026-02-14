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

    res.status(200).json(events);
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

    await event.deleteOne();

    res.status(200).json({ message: "Event deleted" });
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

    res.status(200).json(events);
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

    if (currentCount >= event.capacity)
      return res.status(400).json({ message: "Event is full" });

    // Create registration
    const registration = await Registration.create({
      user: req.user.id,
      event: event._id,
    });

    res.status(201).json({
      message: "Registered successfully",
      registration,
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
    }).populate("user", "email role");

    const attendees = registrations.map((reg) => reg.user);

    res.status(200).json(attendees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
