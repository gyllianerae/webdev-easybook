const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    status: {
      type: String,
      enum: ["booked", "cancelled"],
      default: "booked"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
