const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const { sendTicketEmail } = require("../utils/emailService");

const postToDiscord = async (webhookUrl, event, organizerName) => {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: `New Event: ${event.title}`,
          description: event.description?.slice(0, 200) || "",
          color: 0x007bff,
          fields: [
            { name: "Organizer", value: organizerName || "Unknown", inline: true },
            { name: "Type", value: event.eventType === "merchandise" ? "Merchandise" : "Normal", inline: true },
            { name: "Date", value: new Date(event.date).toLocaleDateString(), inline: true },
            { name: "Location", value: event.location || "TBD", inline: true },
            { name: "Fee", value: event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free", inline: true },
            { name: "Capacity", value: String(event.capacity), inline: true },
          ],
          footer: { text: "Event Management System" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    console.error("Discord webhook failed:", e.message);
  }
};

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user.id,
    });

    if (req.body.status === "published") {
      const organizer = await User.findById(req.user.id);
      if (organizer?.discordWebhook) {
        await postToDiscord(organizer.discordWebhook, event, organizer.organizerName);
      }
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.id });

    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const count = await Registration.countDocuments({ event: event._id });
        const attendedCount = await Registration.countDocuments({ event: event._id, attended: true });

        return {
          ...event.toObject(),
          registrationCount: count,
          attendedCount,
          revenue: count * (event.registrationFee || 0),
        };
      })
    );

    res.status(200).json(eventsWithCount);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: "published" }).populate(
      "createdBy",
      "email"
    );

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

exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.status !== "published")
      return res.status(400).json({ message: "Event not published yet" });

    const userDoc = await User.findById(req.user.id);
    if (event.eligibility && event.eligibility.toLowerCase().includes("iiit") && !event.eligibility.toLowerCase().includes("non")) {
      if (userDoc.userType !== "iiit-participant") {
        return res.status(403).json({ message: "This event is restricted to IIIT students only" });
      }
    }
    if (event.eligibility && event.eligibility.toLowerCase().includes("non-iiit")) {
      if (userDoc.userType !== "non-iiit-participant") {
        return res.status(403).json({ message: "This event is restricted to non-IIIT participants only" });
      }
    }

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

    let customFormResponses = {};
    if (event.eventType === "normal" && event.customForm && event.customForm.length > 0) {
      customFormResponses = req.body.customFormResponses || {};

      for (const field of event.customForm) {
        if (field.required && !customFormResponses[field.fieldName]) {
          return res.status(400).json({
            message: `${field.fieldLabel} is required`
          });
        }
      }
    }

    const crypto = require("crypto");
    const QRCode = require("qrcode");

    const ticketId = crypto.randomBytes(6).toString("hex");
    const qrData = await QRCode.toDataURL(ticketId);

    const registrationData = {
      user: req.user.id,
      event: event._id,
      ticketId,
      customFormResponses,
    };

    if (event.eventType === "merchandise") {
      const { paymentProof, merchandiseSelections } = req.body;

      if (!paymentProof) {
        return res.status(400).json({ message: "Payment proof is required for merchandise events" });
      }

      const userPurchaseCount = await Registration.countDocuments({
        user: req.user.id,
        event: event._id,
      });
      const limit = event.merchandiseDetails?.purchaseLimitPerParticipant || 1;
      if (userPurchaseCount >= limit) {
        return res.status(400).json({ message: `Purchase limit of ${limit} reached` });
      }

      if (event.merchandiseDetails?.stockQuantity <= 0) {
        return res.status(400).json({ message: "Merchandise is out of stock" });
      }

      registrationData.paymentStatus = "pending";
      registrationData.paymentProof = paymentProof;
      registrationData.merchandiseSelections = merchandiseSelections || {};
    }

    const registration = await Registration.create(registrationData);

    await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: 1 } });

    if (event.eventType === "merchandise" && event.merchandiseDetails) {
      await Event.findByIdAndUpdate(event._id, {
        $inc: { "merchandiseDetails.stockQuantity": -1 },
      });
    }

    const responseData = {
      message: event.eventType === "merchandise"
        ? "Registration submitted. Payment is pending approval."
        : "Registered successfully",
      ticketId,
      registrationId: registration._id,
    };

    if (event.eventType !== "merchandise") {
      responseData.qrCode = qrData;

      try {
        const participantName = `${userDoc.firstName || ""} ${userDoc.lastName || ""}`.trim() || userDoc.email;
        await sendTicketEmail({
          to: userDoc.email,
          participantName,
          eventTitle: event.title,
          eventType: event.eventType,
          ticketId,
          eventDate: event.date,
          location: event.location,
          qrCode: qrData,
        });
      } catch (_) {}
    }

    res.status(201).json(responseData);

  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event" });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const registrations = await Registration.find({
      event: event._id,
    }).populate("user", "email firstName lastName contactNumber");

    const attendees = registrations.map((reg) => ({
      _id: reg.user._id,
      email: reg.user.email,
      firstName: reg.user.firstName || "",
      lastName: reg.user.lastName || "",
      name: `${reg.user.firstName || ""} ${reg.user.lastName || ""}`.trim() || reg.user.email,
      ticketId: reg.ticketId,
      attended: reg.attended,
      attendedAt: reg.attendedAt || null,
      attendanceMethod: reg.attendanceMethod || null,
      registrationDate: reg.createdAt,
      customFormResponses: reg.customFormResponses || {},
      paymentStatus: reg.paymentStatus || "none",
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

    if (event.status === "cancelled") {
      return res.status(400).json({ message: "Cannot change status of cancelled event" });
    }

    const { newStatus } = req.body;

    const validTransitions = {
      draft: ["published"],
      published: ["draft", "ongoing", "closed"],
      ongoing: ["completed", "closed"],
      completed: [],
      closed: [],
    };

    const previousStatus = event.status;

    if (newStatus) {
      const allowed = validTransitions[event.status] || [];
      if (!allowed.includes(newStatus)) {
        return res.status(400).json({ message: `Cannot transition from ${event.status} to ${newStatus}` });
      }
      event.status = newStatus;
    } else {
      event.status = event.status === "draft" ? "published" : "draft";
    }

    await event.save();

    if (previousStatus !== "published" && event.status === "published") {
      const organizer = await User.findById(req.user.id);
      if (organizer?.discordWebhook) {
        await postToDiscord(organizer.discordWebhook, event, organizer.organizerName);
      }
    }

    res.status(200).json(event);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("createdBy", "email organizerName category discordWebhook");

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    if (event.createdBy._id.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    const registrations = await Registration.find({ event: event._id }).populate("user", "email firstName lastName");

    const attendees = registrations.map((reg) => ({
      _id: reg.user._id,
      registrationId: reg._id,
      email: reg.user.email,
      name: `${reg.user.firstName || ""} ${reg.user.lastName || ""}`.trim() || reg.user.email,
      ticketId: reg.ticketId,
      attended: reg.attended,
      attendedAt: reg.attendedAt || null,
      attendanceMethod: reg.attendanceMethod || null,
      registrationDate: reg.createdAt,
      customFormResponses: reg.customFormResponses || {},
      paymentStatus: reg.paymentStatus || "none",
      paymentProof: reg.paymentProof || "",
      rejectionReason: reg.rejectionReason || "",
      merchandiseSelections: reg.merchandiseSelections || {},
    }));

    const attendedCount = attendees.filter(a => a.attended).length;
    const revenue = attendees.length * (event.registrationFee || 0);

    const pendingPayments = attendees.filter(a => a.paymentStatus === "pending").length;
    const approvedPayments = attendees.filter(a => a.paymentStatus === "approved").length;
    const rejectedPayments = attendees.filter(a => a.paymentStatus === "rejected").length;

    const eventData = event.toObject();
    if (!eventData.eventType) eventData.eventType = "normal";
    if (!eventData.customForm) eventData.customForm = [];

    res.status(200).json({
      ...eventData,
      attendees,
      analytics: {
        totalRegistrations: attendees.length,
        attendedCount,
        revenue,
        attendanceRate: attendees.length > 0 ? Math.round((attendedCount / attendees.length) * 100) : 0,
        pendingPayments,
        approvedPayments,
        rejectedPayments,
      },
      hasRegistrations: attendees.length > 0,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

exports.cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to cancel this event" });
    }

    if (event.status === "cancelled") {
      return res.status(400).json({ message: "Event is already cancelled" });
    }

    event.status = "cancelled";
    await event.save();

    res.status(200).json({ message: "Event cancelled successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

