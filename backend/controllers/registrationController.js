const Registration = require("../models/Registration");
const Event = require("../models/Event");
const QRCode = require("qrcode");
const { sendTicketEmail } = require("../utils/emailService");

exports.getMyRegisteredEvents = async (req, res) => {
  try {
    const registrations = await Registration.find({
      user: req.user.id,
    }).populate("event");

    const events = await Promise.all(
      registrations
        .filter((reg) => reg.event !== null)
        .map(async (reg) => {
          let qrCode = null;
          const isMerch = reg.event.eventType === "merchandise";
          const showQR = !isMerch || reg.paymentStatus === "approved";
          if (showQR) {
            qrCode = await QRCode.toDataURL(reg.ticketId);
          }

          return {
            ...reg.event.toObject(),
            ticketId: reg.ticketId,
            attended: reg.attended,
            qrCode,
            registrationId: reg._id,
            eventStatus: reg.event.status,
            paymentStatus: reg.paymentStatus || "none",
            rejectionReason: reg.rejectionReason || "",
            merchandiseSelections: reg.merchandiseSelections || {},
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
    await Event.findByIdAndUpdate(req.params.eventId, { $inc: { registeredCount: -1 } });
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

exports.getPendingPayments = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    const registrations = await Registration.find({
      event: event._id,
      paymentStatus: "pending",
    }).populate("user", "email firstName lastName contactNumber");

    const pending = registrations.map((reg) => ({
      registrationId: reg._id,
      ticketId: reg.ticketId,
      user: {
        _id: reg.user._id,
        email: reg.user.email,
        name: `${reg.user.firstName || ""} ${reg.user.lastName || ""}`.trim() || reg.user.email,
        contactNumber: reg.user.contactNumber || "",
      },
      paymentProof: reg.paymentProof,
      merchandiseSelections: reg.merchandiseSelections || {},
      registrationDate: reg.createdAt,
    }));

    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId).populate("event user");
    if (!registration)
      return res.status(404).json({ message: "Registration not found" });

    const event = registration.event;
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    if (registration.paymentStatus !== "pending")
      return res.status(400).json({ message: `Payment is already ${registration.paymentStatus}` });

    if (event.merchandiseDetails && event.merchandiseDetails.stockQuantity <= 0)
      return res.status(400).json({ message: "Merchandise is out of stock" });

    registration.paymentStatus = "approved";
    await registration.save();

    const qrCode = await QRCode.toDataURL(registration.ticketId);

    try {
      const participantName = `${registration.user?.firstName || ""} ${registration.user?.lastName || ""}`.trim() || registration.user?.email;
      await sendTicketEmail({
        to: registration.user?.email,
        participantName,
        eventTitle: event.title,
        eventType: event.eventType,
        ticketId: registration.ticketId,
        eventDate: event.date,
        location: event.location,
        qrCode,
      });
    } catch (_) {}

    res.status(200).json({
      message: "Payment approved successfully",
      registrationId: registration._id,
      paymentStatus: "approved",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId).populate("event");
    if (!registration)
      return res.status(404).json({ message: "Registration not found" });

    const event = registration.event;
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    if (registration.paymentStatus !== "pending")
      return res.status(400).json({ message: `Payment is already ${registration.paymentStatus}` });

    registration.paymentStatus = "rejected";
    registration.rejectionReason = req.body.reason || "Payment rejected by organizer";
    await registration.save();

    res.status(200).json({
      message: "Payment rejected",
      registrationId: registration._id,
      paymentStatus: "rejected",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.scanQRAttendance = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { eventId } = req.body;

    const registration = await Registration.findOne({ ticketId }).populate("event user");
    if (!registration)
      return res.status(404).json({ message: "Invalid ticket - not found" });

    if (eventId && registration.event._id.toString() !== eventId)
      return res.status(400).json({ message: "Ticket does not belong to this event" });

    const event = registration.event;
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized for this event" });

    if (event.eventType === "merchandise" && registration.paymentStatus !== "approved")
      return res.status(400).json({ message: "Payment not approved for this registration" });

    if (registration.attended) {
      return res.status(409).json({
        message: "Duplicate scan - attendance already marked",
        attendedAt: registration.attendedAt,
        attendanceMethod: registration.attendanceMethod,
      });
    }

    registration.attended = true;
    registration.attendedAt = new Date();
    registration.attendanceMarkedBy = req.user.id;
    registration.attendanceMethod = "qr_scan";
    registration.attendanceAuditLog.push({
      action: "marked_attended",
      performedBy: req.user.id,
      timestamp: new Date(),
      reason: "QR code scanned",
    });
    await registration.save();

    res.status(200).json({
      message: "Attendance marked successfully",
      participant: {
        name: `${registration.user.firstName || ""} ${registration.user.lastName || ""}`.trim() || registration.user.email,
        email: registration.user.email,
        ticketId: registration.ticketId,
      },
      event: {
        title: event.title,
        _id: event._id,
      },
      attendedAt: registration.attendedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.manualOverrideAttendance = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason, action } = req.body;

    const registration = await Registration.findById(registrationId).populate("event user");
    if (!registration)
      return res.status(404).json({ message: "Registration not found" });

    const event = registration.event;
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    if (!reason)
      return res.status(400).json({ message: "Reason is required for manual override" });

    const markAttended = action !== "unmark";

    registration.attended = markAttended;
    registration.attendedAt = markAttended ? new Date() : null;
    registration.attendanceMarkedBy = req.user.id;
    registration.attendanceMethod = "manual_override";
    registration.attendanceAuditLog.push({
      action: markAttended ? "manual_mark_attended" : "manual_unmark_attended",
      performedBy: req.user.id,
      timestamp: new Date(),
      reason,
    });
    await registration.save();

    res.status(200).json({
      message: markAttended ? "Attendance manually marked" : "Attendance manually unmarked",
      registrationId: registration._id,
      attended: registration.attended,
      auditLog: registration.attendanceAuditLog,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendanceDashboard = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    let query = { event: event._id };
    if (event.eventType === "merchandise") {
      query.paymentStatus = "approved";
    }

    const registrations = await Registration.find(query).populate(
      "user",
      "email firstName lastName contactNumber"
    );

    const attended = [];
    const notAttended = [];

    registrations.forEach((reg) => {
      const entry = {
        registrationId: reg._id,
        ticketId: reg.ticketId,
        name: `${reg.user.firstName || ""} ${reg.user.lastName || ""}`.trim() || reg.user.email,
        email: reg.user.email,
        contactNumber: reg.user.contactNumber || "",
        attended: reg.attended,
        attendedAt: reg.attendedAt || null,
        attendanceMethod: reg.attendanceMethod || null,
        registrationDate: reg.createdAt,
      };
      if (reg.attended) attended.push(entry);
      else notAttended.push(entry);
    });

    res.status(200).json({
      eventTitle: event.title,
      eventId: event._id,
      totalEligible: registrations.length,
      attendedCount: attended.length,
      notAttendedCount: notAttended.length,
      attendanceRate: registrations.length > 0 ? Math.round((attended.length / registrations.length) * 100) : 0,
      attended,
      notAttended,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportAttendanceCSV = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    let query = { event: event._id };
    if (event.eventType === "merchandise") {
      query.paymentStatus = "approved";
    }

    const registrations = await Registration.find(query).populate(
      "user",
      "email firstName lastName contactNumber"
    );

    const headers = ["Name", "Email", "Contact", "Ticket ID", "Attended", "Attended At", "Method", "Registration Date"];
    const rows = registrations.map((reg) => [
      `${reg.user.firstName || ""} ${reg.user.lastName || ""}`.trim() || reg.user.email,
      reg.user.email,
      reg.user.contactNumber || "",
      reg.ticketId,
      reg.attended ? "Yes" : "No",
      reg.attendedAt ? new Date(reg.attendedAt).toISOString() : "",
      reg.attendanceMethod || "",
      new Date(reg.createdAt).toISOString(),
    ]);

    const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${event.title}_attendance.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

