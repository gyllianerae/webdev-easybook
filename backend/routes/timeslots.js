const router = require("express").Router();
const TimeSlot = require("../models/TimeSlot");
const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

router.get("/", async (req, res) => {
  try {
    const slots = await TimeSlot.find().populate("createdBy", "name email");
    
    // Get booking counts for each time slot
    const slotsWithBookings = await Promise.all(
      slots.map(async (slot) => {
        const bookingCount = await Appointment.countDocuments({
          timeSlot: slot._id,
          status: "booked"
        });
        return {
          ...slot.toObject(),
          currentBookings: bookingCount
        };
      })
    );
    
    res.json(slotsWithBookings);
  } catch (err) {
    console.error(err);
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

    const populatedSlot = await TimeSlot.findById(slot._id).populate("createdBy", "name email");
    res.status(201).json(populatedSlot);
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
