"use strict";
const mongoose = require("mongoose");

//-->⛏️FIX: add required: true

const parkingSchema = mongoose.Schema({
  title: { type: String },
  description: { type: String },
  pictures: [{ type: String }],
  spaces: { type: Number },
  covered: { type: Boolean, default: false },
  indoor: { type: Boolean, default: false },
  address: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  terrain: { type: String, default: "concrete" },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pricePerHour: { type: Number, default: 0 },
  extraFeatures: { type: String, default: "N/A" },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
});

parkingSchema.pre(["findOne", "find"], function (next) {
  this.populate("host");
  next();
});

parkingSchema.methods.censorParking = function () {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    pictures: this.pictures,
    spaces: this.spaces,
    covered: this.covered,
    indoor: this.indoor,
    address: this.address,
    location: this.location,
    terrain: this.terrain,
    host: this.host.censorUserInfo(), //can use the instance method that we made earlier on the User.js model.
    pricePerHour: this.pricePerHour,
    extraFeatures: this.extraFeatures,
  };
};

const Parking = mongoose.model("Parking", parkingSchema, "parkings");

module.exports = { Parking };

//If no pictures are provided, the front-end will handle displaying placeholder image "https://i.ibb.co/K94DwZc/empty.jpg"
