const router = require("express").Router();
const TimeSlot = require("../models/TimeSlot");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

router.get("/", async (req, res) => {
  try {
    const slots = await TimeSlot.find().populate("createdBy", "name email");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/", auth, requireRole(["staff", "admin"]), async (req, res) => {
  try {
    const { title, date, startTime, endTime, maxBookings } = req.body;

    const slot = await TimeSlot.create({
      title,
      date,
      startTime,
      endTime,
      maxBookings: maxBookings || 1,
      createdBy: req.user.id
    });

    res.status(201).json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/:id", auth, requireRole(["staff", "admin"]), async (req, res) => {
  try {
    await TimeSlot.findByIdAndDelete(req.params.id);
    res.json({ msg: "Time slot deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
