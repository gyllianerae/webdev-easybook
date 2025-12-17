const router = require("express").Router();
const Appointment = require("../models/Appointment");
const TimeSlot = require("../models/TimeSlot");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// Get all appointments (filtered by role)
router.get("/", auth, async (req, res) => {
  try {
    let query = {};
    
    // Students can only see their own appointments
    if (req.user.role === "student") {
      query.student = req.user.id;
    }
    
    const appointments = await Appointment.find(query)
      .populate("student", "name email")
      .populate({
        path: "timeSlot",
        populate: { path: "createdBy", select: "name email" }
      })
      .sort({ createdAt: -1 });
    
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Book an appointment
router.post("/", auth, requireRole(["student"]), async (req, res) => {
  try {
    const { timeSlotId } = req.body;
    
    if (!timeSlotId) {
      return res.status(400).json({ msg: "Time slot ID is required" });
    }
    
    // Check if time slot exists
    const timeSlot = await TimeSlot.findById(timeSlotId);
    if (!timeSlot) {
      return res.status(404).json({ msg: "Time slot not found" });
    }
    
    // Check if student already has an appointment for this time slot
    const existingAppointment = await Appointment.findOne({
      student: req.user.id,
      timeSlot: timeSlotId,
      status: "booked"
    });
    
    if (existingAppointment) {
      return res.status(400).json({ msg: "You already have an appointment for this time slot" });
    }
    
    // Check how many appointments exist for this time slot
    const bookingCount = await Appointment.countDocuments({
      timeSlot: timeSlotId,
      status: "booked"
    });
    
    if (bookingCount >= timeSlot.maxBookings) {
      return res.status(400).json({ msg: "This time slot is fully booked" });
    }
    
    // Create the appointment
    const appointment = await Appointment.create({
      student: req.user.id,
      timeSlot: timeSlotId,
      status: "booked"
    });
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("student", "name email")
      .populate({
        path: "timeSlot",
        populate: { path: "createdBy", select: "name email" }
      });
    
    res.status(201).json(populatedAppointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Cancel an appointment
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }
    
    // Students can only cancel their own appointments
    // Staff/Admin can cancel any appointment
    if (req.user.role === "student" && appointment.student.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden" });
    }
    
    if (appointment.status === "cancelled") {
      return res.status(400).json({ msg: "Appointment is already cancelled" });
    }
    
    appointment.status = "cancelled";
    await appointment.save();
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("student", "name email")
      .populate({
        path: "timeSlot",
        populate: { path: "createdBy", select: "name email" }
      });
    
    res.json(populatedAppointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete an appointment (admin/staff only)
router.delete("/:id", auth, requireRole(["staff", "admin"]), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate("timeSlot");
    
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isSlotOwner = appointment.timeSlot && appointment.timeSlot.createdBy.toString() === req.user.id;

    // Staff can only delete appointments for their own time slots; admins can delete any
    if (!isAdmin && !isSlotOwner) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    await appointment.deleteOne();
    
    res.json({ msg: "Appointment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

