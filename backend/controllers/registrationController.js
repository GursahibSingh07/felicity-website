const Registration = require("../models/Registration");
const QRCode = require("qrcode");

exports.getMyRegisteredEvents = async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user.id,
    }).populate("event");

    const events = await Promise.all(
      registrations
        .filter((reg) => reg.event !== null)
        .map(async (reg) => {
          const qrCode = await QRCode.toDataURL(reg.ticketId);

          return {
            ...reg.event.toObject(),
            ticketId: reg.ticketId,
            attended: reg.attended,
            qrCode,
          };
        })
    );

    res.status(200).json(events);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.unregisterFromEvent = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user: req.user.id,
      event: req.params.eventId,
    });

    if (!registration) {
      return res
        .status(404)
        .json({ message: "You are not registered for this event" });
    }

    await registration.deleteOne();

    res.status(200).json({ message: "Unregistered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      ticketId: req.params.ticketId,
    });

    if (!registration)
      return res.status(404).json({ message: "Ticket not found" });

    registration.attended = true;
    await registration.save();

    res.status(200).json({
      message: "Attendance marked successfully",
      ticketId: registration.ticketId,
      attended: registration.attended,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateTicket = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      ticketId: req.params.ticketId,
    }).populate("event user");

    if (!registration)
      return res.status(404).json({ message: "Invalid ticket" });

    res.status(200).json({
      valid: true,
      attended: registration.attended,
      event: registration.event.title,
      user: registration.user.email,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

