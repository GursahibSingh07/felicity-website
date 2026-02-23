const Feedback = require("../models/Feedback");
const Registration = require("../models/Registration");
const Event = require("../models/Event");

const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const registration = await Registration.findOne({
      user: req.user.id,
      event: eventId,
      attended: true,
    });

    if (!registration) {
      return res.status(403).json({ message: "You can only provide feedback for events you have attended" });
    }

    const existing = await Feedback.findOne({ event: eventId, user: req.user.id });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment || "";
      await existing.save();
      return res.status(200).json({ message: "Feedback updated", feedback: existing });
    }

    const feedback = await Feedback.create({
      event: eventId,
      user: req.user.id,
      rating,
      comment: comment || "",
    });

    res.status(201).json({ message: "Feedback submitted", feedback });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already submitted feedback for this event" });
    }
    res.status(500).json({ message: error.message });
  }
};

const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating } = req.query;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view feedback for this event" });
    }

    const filter = { event: eventId };
    if (rating) {
      filter.rating = parseInt(rating);
    }

    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });

    const allFeedbacks = await Feedback.find({ event: eventId });
    const totalCount = allFeedbacks.length;
    const averageRating = totalCount > 0
      ? (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1)
      : 0;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allFeedbacks.forEach(f => {
      distribution[f.rating]++;
    });

    res.status(200).json({
      feedbacks,
      stats: {
        totalCount,
        averageRating: parseFloat(averageRating),
        distribution,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const feedback = await Feedback.findOne({ event: eventId, user: req.user.id });
    res.status(200).json(feedback || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getEventFeedback,
  getMyFeedback,
};
