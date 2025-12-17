const router = require("express").Router();
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

module.exports = router;
