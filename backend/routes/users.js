const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const TimeSlot = require("../models/TimeSlot");
const Appointment = require("../models/Appointment");
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

// Create user (admin only)
router.post("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "Please provide name, email, password, and role" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User with this email already exists" });
    }

    // Validate role
    if (!["student", "staff", "admin"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();
    const sanitized = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
    res.status(201).json(sanitized);
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

// Delete user (admin only)
router.delete("/:id", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ msg: "You cannot delete your own account" });
    }

    const userId = user._id;
    const userRole = user.role;

    // If user is staff or admin, delete their created time slots (and associated appointments)
    if (userRole === "staff" || userRole === "admin") {
      // Find all time slots created by this user
      const timeSlots = await TimeSlot.find({ createdBy: userId });
      const timeSlotIds = timeSlots.map((ts) => ts._id);

      // Delete all appointments associated with these time slots
      if (timeSlotIds.length > 0) {
        await Appointment.deleteMany({ timeSlot: { $in: timeSlotIds } });
      }

      // Delete all time slots created by this user
      await TimeSlot.deleteMany({ createdBy: userId });
    }

    // If user is student or admin, delete their bookings (appointments)
    if (userRole === "student" || userRole === "admin") {
      await Appointment.deleteMany({ student: userId });
    }

    // Finally, delete the user
    await User.findByIdAndDelete(userId);
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
