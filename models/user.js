"use strict";
const mongoose = require("mongoose");

//-->⛏️FIX: add required: true
//-->⛏️FIX: add virtuals
//-->⛏️FIX: add instance methodf

//create userSchema blueprint
const userSchema = mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true },
  password: { type: String, minlength: 6 },
  image: {
    type: String,
    default: "https://i.ibb.co/2dtXpf2/blank-avatar.webp",
  },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bookings" }],
  parkings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Parking" }],
});

//creating our own method on the model
userSchema.methods.censorUserInfo = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    image: this.image,
    parkings: this.parkings,
    bookings: this.bookings,
  };
};

const User = mongoose.model("User", userSchema, "users");
module.exports = { User };

// 📒NOTES:
//   * bookings will hold all past and present/active bookings. The host and guest will point to same booking object.
