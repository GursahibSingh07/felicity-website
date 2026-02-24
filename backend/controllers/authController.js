const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { isIIITEmail, isValidEmail, validatePassword } = require("../utils/emailValidator");


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isDisabled) {
      return res.status(403).json({
        message: "Your account has been disabled. Please contact the administrator.",
      });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        isRoleLocked: user.isRoleLocked,
        preferencesComplete: user.preferencesComplete,
        firstName: user.firstName,
        lastName: user.lastName,
        collegeOrgName: user.collegeOrgName,
        contactNumber: user.contactNumber,
        organizerName: user.organizerName,
        category: user.category,
        description: user.description,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const registerUser = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      userType,
      firstName,
      lastName,
      collegeOrgName,
      contactNumber
    } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({
        message: "Email, password, and userType are required",
      });
    }

    if (["iiit-participant", "non-iiit-participant"].includes(userType)) {
      if (!firstName || !lastName) {
        return res.status(400).json({
          message: "First name and last name are required for participants",
        });
      }
      if (!collegeOrgName) {
        return res.status(400).json({
          message: "College/Organization name is required for participants",
        });
      }
      if (!contactNumber) {
        return res.status(400).json({
          message: "Contact number is required for participants",
        });
      }
      if (!/^\d{10}$/.test(contactNumber)) {
        return res.status(400).json({
          message: "Contact number must be exactly 10 digits",
        });
      }
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (userType === "iiit-participant") {
      if (!isIIITEmail(email)) {
        return res.status(400).json({
          message: "IIIT participants must use @iiit.ac.in email address",
        });
      }
    }

    if (userType === "non-iiit-participant") {
      if (isIIITEmail(email)) {
        return res.status(400).json({
          message: "IIIT email addresses must register as IIIT participant",
        });
      }
    }

    if (!["iiit-participant", "non-iiit-participant"].includes(userType)) {
      return res.status(400).json({
        message: "Invalid userType. Must be 'iiit-participant' or 'non-iiit-participant'",
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: "participant",
      userType,
      isRoleLocked: true,
      firstName: firstName || "",
      lastName: lastName || "",
      collegeOrgName: collegeOrgName || "",
      contactNumber: contactNumber || "",
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        isRoleLocked: user.isRoleLocked,
        preferencesComplete: user.preferencesComplete,
        firstName: user.firstName,
        lastName: user.lastName,
        collegeOrgName: user.collegeOrgName,
        contactNumber: user.contactNumber,
        organizerName: user.organizerName,
        category: user.category,
        description: user.description,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Token verified",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        isRoleLocked: user.isRoleLocked,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      isRoleLocked: user.isRoleLocked,
      preferencesComplete: user.preferencesComplete,
      firstName: user.firstName,
      lastName: user.lastName,
      collegeOrgName: user.collegeOrgName,
      contactNumber: user.contactNumber,
      organizerName: user.organizerName,
      category: user.category,
      description: user.description,
      discordWebhook: user.discordWebhook,
      contactEmail: user.contactEmail,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      firstName,
      lastName,
      collegeOrgName,
      contactNumber,
      organizerName,
      category,
      description,
      discordWebhook,
      contactEmail,
    } = req.body;

    if (user.role === "participant") {
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (collegeOrgName !== undefined) user.collegeOrgName = collegeOrgName;
      if (contactNumber !== undefined) {
        if (!/^\d{10}$/.test(contactNumber)) {
          return res.status(400).json({
            message: "Contact number must be exactly 10 digits",
          });
        }
        user.contactNumber = contactNumber;
      }
    } else if (user.role === "organizer") {
      if (organizerName !== undefined) user.organizerName = organizerName;
      if (category !== undefined) user.category = category;
      if (description !== undefined) user.description = description;
      if (discordWebhook !== undefined) user.discordWebhook = discordWebhook;
      if (contactEmail !== undefined) user.contactEmail = contactEmail;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        collegeOrgName: user.collegeOrgName,
        contactNumber: user.contactNumber,
        organizerName: user.organizerName,
        category: user.category,
        description: user.description,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  verifyToken,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
