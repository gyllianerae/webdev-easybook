const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true }, 
    date: { type: String, required: true },   
    startTime: { type: String, required: true }, 
    endTime: { type: String, required: true },  
    maxBookings: { type: Number, default: 1 },   
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
