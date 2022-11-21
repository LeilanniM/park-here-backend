"use strict";
const mongoose = require("mongoose");

//-->⛏️FIX: add required: true

const vehicleSchema = mongoose.Schema({
  color: { type: String },
  licensePlate: { type: String },
  vehicleType: { type: String, default: "car" },
});

const bookingSchema = mongoose.Schema({
  bookingDate: [{ type: Date }],
  checkIn: [{ type: Date }],
  checkOut: [{ type: Date }],
  //   confirmationNum: { type: String }, //we will generate this using a uuid npm package of some sort
  guest: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vehicles: [vehicleSchema],
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  parking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parking",
    required: true,
  },
  totalCost: { type: Number, default: 0 },
  notes: [{ type: String, default: "N/A" }], //make this into a simple subdocument ⛏️,
});

bookingSchema.pre(["findOne", "find"], function (next) {
  this.populate("parking");
  next();
});

const Booking = mongoose.model("Booking", bookingSchema, "bookings");

module.exports = { Booking };
