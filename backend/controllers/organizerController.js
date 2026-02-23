const User = require("../models/User");

exports.getAllOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ 
      role: "organizer"
    }).select("organizerName category description email");

    res.status(200).json(organizers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrganizerById = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id).select("organizerName category description email");

    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const Event = require("../models/Event");
    const now = new Date();
    
    const upcomingEvents = await Event.find({ 
      createdBy: organizer._id,
      status: "published",
      date: { $gte: now }
    }).select("title description date endDate location eventType registrationFee capacity registeredCount");

    const pastEvents = await Event.find({ 
      createdBy: organizer._id,
      status: "published",
      date: { $lt: now }
    }).select("title description date endDate location eventType");

    res.status(200).json({
      organizer,
      upcomingEvents,
      pastEvents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.followOrganizer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const organizerId = req.params.id;

    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (user.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({ message: "Already following this organizer" });
    }

    user.followedOrganizers.push(organizerId);
    await user.save();

    res.status(200).json({ message: "Organizer followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowOrganizer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const organizerId = req.params.id;

    user.followedOrganizers = user.followedOrganizers.filter(
      id => id.toString() !== organizerId
    );
    await user.save();

    res.status(200).json({ message: "Organizer unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFollowedOrganizers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "followedOrganizers",
      "organizerName category description email"
    );

    res.status(200).json(user.followedOrganizers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
