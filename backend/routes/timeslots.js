const router = require("express").Router();
const TimeSlot = require("../models/TimeSlot");
const User = require("../models/User");
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
    const { title, date, startTime, endTime, maxBookings, staffId } = req.body;

    let ownerId = req.user.id;

    // Admins can assign a timeslot to a staff member
    if (req.user.role === "admin" && staffId) {
      const staff = await User.findOne({ _id: staffId, role: "staff" });
      if (!staff) {
        return res.status(400).json({ msg: "Staff member not found" });
      }
      ownerId = staffId;
    }

    // Staff cannot assign to others
    if (req.user.role === "staff" && staffId && staffId !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    const slot = await TimeSlot.create({
      title,
      date,
      startTime,
      endTime,
      maxBookings: maxBookings || 1,
      createdBy: ownerId
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
    const slot = await TimeSlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ msg: "Time slot not found" });
    }

    // Staff can only delete their own time slots; admins can delete any
    const isAdmin = req.user.role === "admin";
    const isSlotOwner = slot.createdBy.toString() === req.user.id;

    if (!isAdmin && !isSlotOwner) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    await slot.deleteOne();
    res.json({ msg: "Time slot deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
