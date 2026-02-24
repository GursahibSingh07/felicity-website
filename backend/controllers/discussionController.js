const DiscussionMessage = require("../models/DiscussionMessage");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

const verifyEventAccess = async (eventId, userId, userRole) => {
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found", status: 404 };

  if (userRole === "organizer") {
    if (event.createdBy.toString() !== userId) return { error: "Not authorized", status: 403 };
    return { event, isOrganizer: true };
  }

  if (userRole === "participant") {
    const reg = await Registration.findOne({ user: userId, event: eventId });
    if (!reg) return { error: "You must be registered to access the forum", status: 403 };
    return { event, isOrganizer: false };
  }

  return { error: "Access denied", status: 403 };
};

exports.getMessages = async (req, res) => {
  try {
    const access = await verifyEventAccess(req.params.eventId, req.user.id, req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const messages = await DiscussionMessage.find({
      event: req.params.eventId,
    })
      .populate("author", "email firstName lastName organizerName role")
      .sort({ createdAt: 1 });

    const messageMap = new Map();
    messages.forEach((message) => {
      messageMap.set(message._id.toString(), { ...message.toObject(), replies: [] });
    });

    const roots = [];
    messageMap.forEach((message) => {
      if (message.parentMessage) {
        const parent = messageMap.get(message.parentMessage.toString());
        if (parent) {
          parent.replies.push(message);
        } else {
          roots.push(message);
        }
      } else {
        roots.push(message);
      }
    });

    const sortRepliesRecursively = (items) => {
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      items.forEach((item) => {
        if (item.replies?.length) {
          sortRepliesRecursively(item.replies);
        }
      });
    };

    roots.sort((a, b) => {
      if ((b.isPinned ? 1 : 0) !== (a.isPinned ? 1 : 0)) {
        return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    sortRepliesRecursively(roots);

    res.status(200).json({
      messages: roots,
      isOrganizer: access.isOrganizer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const access = await verifyEventAccess(req.params.eventId, req.user.id, req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const { content, parentMessage, isAnnouncement } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: "Message content is required" });

    const msgData = {
      event: req.params.eventId,
      author: req.user.id,
      content: content.trim(),
    };

    if (parentMessage) {
      const parent = await DiscussionMessage.findById(parentMessage);
      if (!parent || parent.event.toString() !== req.params.eventId) {
        return res.status(400).json({ message: "Invalid parent message" });
      }
      msgData.parentMessage = parentMessage;
    }

    if (isAnnouncement && access.isOrganizer) {
      msgData.isAnnouncement = true;
    }

    const message = await DiscussionMessage.create(msgData);
    const populated = await DiscussionMessage.findById(message._id).populate(
      "author",
      "email firstName lastName organizerName role"
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await DiscussionMessage.findById(req.params.messageId).populate("event");
    if (!message) return res.status(404).json({ message: "Message not found" });

    const isOrganizer =
      req.user.role === "organizer" &&
      message.event.createdBy.toString() === req.user.id;

    const isAuthor = message.author.toString() === req.user.id;

    if (!isOrganizer && !isAuthor) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    message.isDeleted = true;
    message.deletedBy = req.user.id;
    message.content = "[Message deleted]";
    await message.save();

    res.status(200).json({ message: "Message deleted", messageId: message._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const message = await DiscussionMessage.findById(req.params.messageId).populate("event");
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (req.user.role !== "organizer" || message.event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only organizers can pin messages" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    res.status(200).json({ message: message.isPinned ? "Message pinned" : "Message unpinned", isPinned: message.isPinned });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const message = await DiscussionMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const access = await verifyEventAccess(message.event.toString(), req.user.id, req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const existingIdx = message.reactions.findIndex(
      (r) => r.user.toString() === req.user.id && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions.push({ emoji, user: req.user.id });
    }

    await message.save();

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { since } = req.query;

    const access = await verifyEventAccess(eventId, req.user.id, req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const query = { event: eventId, isDeleted: false };
    if (since) query.createdAt = { $gt: new Date(since) };

    const count = await DiscussionMessage.countDocuments(query);

    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
