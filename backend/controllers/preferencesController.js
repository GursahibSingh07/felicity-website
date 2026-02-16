const User = require("../models/User");
const Event = require("../models/Event");

exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("areasOfInterest followedOrganizers preferencesComplete")
      .populate("followedOrganizers", "email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      areasOfInterest: user.areasOfInterest,
      followedOrganizers: user.followedOrganizers,
      preferencesComplete: user.preferencesComplete,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { areasOfInterest, followedOrganizers } = req.body;
    const userId = req.user.id;

    if (!areasOfInterest && !followedOrganizers) {
      return res.status(400).json({
        message: "Either areasOfInterest or followedOrganizers must be provided",
      });
    }

    if (areasOfInterest && !Array.isArray(areasOfInterest)) {
      return res.status(400).json({
        message: "areasOfInterest must be an array",
      });
    }

    if (followedOrganizers && !Array.isArray(followedOrganizers)) {
      return res.status(400).json({
        message: "followedOrganizers must be an array of user IDs",
      });
    }

    if (followedOrganizers && followedOrganizers.length > 0) {
      const organizers = await User.find({
        _id: { $in: followedOrganizers },
        role: "organizer",
      });

      if (organizers.length !== followedOrganizers.length) {
        return res.status(400).json({
          message: "One or more user IDs are not organizers",
        });
      }
    }

    const updateData = { preferencesComplete: true };
    if (areasOfInterest) updateData.areasOfInterest = areasOfInterest;
    if (followedOrganizers)
      updateData.followedOrganizers = followedOrganizers;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("areasOfInterest followedOrganizers preferencesComplete");

    res.status(200).json({
      message: "Preferences updated successfully",
      preferences: {
        areasOfInterest: updatedUser.areasOfInterest,
        followedOrganizers: updatedUser.followedOrganizers,
        preferencesComplete: updatedUser.preferencesComplete,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.skipPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { preferencesComplete: true },
      { new: true }
    ).select("preferencesComplete");

    res.status(200).json({
      message: "Preferences skipped. You can configure them later from your profile.",
      preferencesComplete: updatedUser.preferencesComplete,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecommendedEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "areasOfInterest followedOrganizers"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const query = {
      status: "published",
      date: { $gte: new Date() },
    };

    let events = [];

    if (
      user.areasOfInterest.length > 0 ||
      user.followedOrganizers.length > 0
    ) {
      const preferenceQuery = {
        $or: [],
      };

      if (user.followedOrganizers.length > 0) {
        preferenceQuery.$or.push({
          createdBy: { $in: user.followedOrganizers },
        });
      }

      if (user.areasOfInterest.length > 0) {
        preferenceQuery.$or.push({
          $or: user.areasOfInterest.map((interest) => ({
            $or: [
              { title: { $regex: interest, $options: "i" } },
              { description: { $regex: interest, $options: "i" } },
            ],
          })),
        });
      }

      events = await Event.find({ ...query, ...preferenceQuery })
        .populate("createdBy", "email")
        .sort({ date: 1 })
        .limit(20);
    }

    if (events.length < 20) {
      const otherEvents = await Event.find({
        ...query,
        _id: { $nin: events.map((e) => e._id) },
      })
        .populate("createdBy", "email")
        .sort({ date: 1 })
        .limit(20 - events.length);

      events = [...events, ...otherEvents];
    }

    res.status(200).json({
      count: events.length,
      events: events.map((event) => ({
        _id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        capacity: event.capacity,
        registeredCount: event.registeredCount,
        createdBy: event.createdBy,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailableInterests = async (req, res) => {
  try {
    const interests = [
      "Technology",
      "Sports",
      "Arts & Culture",
      "Business",
      "Science",
      "Self-Development",
      "Social Impact",
      "Entertainment",
      "Music",
      "Gaming",
      "Photography",
      "Entrepreneurship",
      "Academics",
      "Networking",
      "Other",
    ];

    res.status(200).json({ interests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAvailableOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({
      role: "organizer",
      userType: "organizer",
    })
      .select("_id email createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
