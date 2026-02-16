const express = require("express");
const router = express.Router();
const { loginUser, registerUser, verifyToken } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/verify", protect, verifyToken);

module.exports = router;
