const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { isValidEmail, validatePassword } = require("../utils/emailValidator");


const provisionFirstAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      return res.status(403).json({
        message: "Admin already exists. No additional admins can be provisioned.",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await User.create({
      email,
      password: hashedPassword,
      role: "admin",
      userType: "admin",
      isRoleLocked: true,
    });

    res.status(201).json({
      message: "First admin provisioned successfully",
      token: generateToken(admin._id),
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        userType: admin.userType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const createOrganizer = async (req, res) => {
  try {
    const { email, password, organizationName } = req.body;

    if (!email || !password || !organizationName) {
      return res.status(400).json({
        message: "Email, password, and organizationName are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const organizerExists = await User.findOne({ email });
    if (organizerExists) {
      return res.status(400).json({
        message: "Organizer with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const organizer = await User.create({
      email,
      password: hashedPassword,
      role: "organizer",
      userType: "organizer",
      isRoleLocked: true, 
      createdBy: req.user.id, 
    });

    res.status(201).json({
      message: "Organizer account created successfully",
      user: {
        id: organizer._id,
        email: organizer.email,
        role: organizer.role,
        userType: organizer.userType,
        organizationName,
        createdAt: organizer.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const resetOrganizerPassword = async (req, res) => {
  try {
    const { organizerId, newPassword } = req.body;

    if (!organizerId || !newPassword) {
      return res.status(400).json({
        message: "organizerId and newPassword are required",
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    organizer.password = hashedPassword;
    await organizer.save();

    res.json({
      message: "Organizer password reset successfully",
      organizer: {
        id: organizer._id,
        email: organizer.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: "organizer" }).select(
      "-password"
    );

    res.json({
      message: "Organizers retrieved successfully",
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const deleteOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== "organizer") {
      return res.status(404).json({
        message: "Organizer not found",
      });
    }

    await User.deleteOne({ _id: organizerId });

    res.json({
      message: "Organizer deleted successfully",
      organizer: {
        id: organizerId,
        email: organizer.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  provisionFirstAdmin,
  createOrganizer,
  resetOrganizerPassword,
  getAllOrganizers,
  deleteOrganizer,
};
