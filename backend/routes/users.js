const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// List staff users (admin only)
router.get("/staff", auth, requireRole(["admin"]), async (_req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("name email");
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// List all users (admin)
router.get("/", auth, requireRole(["admin"]), async (_req, res) => {
  try {
    const users = await User.find().select("name email role createdAt");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Update user (admin) - name, email, role, password (optional)
router.patch("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    const sanitized = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
    res.json(sanitized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
