"use strict";
const mongoose = require("mongoose");

//-->⛏️FIX: add required: true

const vehicleSchema = mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookings: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  ],
  licensePlate: { type: String },
  vehicleType: { type: String, default: "car" },
  color: { type: String },
});

vehicleSchema.pre(["findOne", "find"], function (next) {
  this.populate("driver");
  next();
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema, "vehicles");

module.exports = { Vehicle };
