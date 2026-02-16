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

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
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


const registerUser = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({
        message: "Email, password, and userType are required",
      });
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

module.exports = {
  loginUser,
  registerUser,
  verifyToken,
};

