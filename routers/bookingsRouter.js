"use strict";
const express = require("express");
const router = express.Router();

//-->⛏️FIX: move to controller later
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User } = require("../models/user");
const { Parking } = require("../models/Parking");
const { Booking } = require("../models/booking");

const { JWT_KEY_SECRET, GOOGLE_API_KEY } = require("../config");
const { checkAuth } = require("../middleware/checkAuth");
const axios = require("axios");

//GET booking by id
router.get("/:id", (req, res, next) => {
  console.log(`getting booking by id ${req.params.id}`);
  Booking.findById(req.params.id)
    .then((bkg) => {
      if (!bkg) {
        return res.status(404).send(`No booking found by that id 😒...`);
      }
      return res.status(200).json(bkg);
    })
    .catch((err) => {
      let message =
        "Your id must be at least 24 characters long and only include numbers and letters (a through f) 😒... ";
      return next({ err, message }); //laundry shoot
    });
});

//GET bookings
router.get("/", (req, res, next) => {
  console.log("getting all bookings");

  Booking.find()
    .then((bookings) => {
      return res.status(200).json(bookings.map((bkg) => bkg));
    })
    .catch((err) => {
      const message = `Failed to fetch any bookings`;
      return next(err, message);
    });
});

router.use(checkAuth); //MIDDLEWARE <--------------------------------

//POST new booking
router.post("/", (req, res, next) => {
  //The front end will send the host as an id <----------💣💣💣💣💣💣💣💣💣💣
  //We actually don't even want the host to be able to book for the guest.
  //The checks below should only apply to the editing/updating of the booking.

  console.log("creating new booking");
  //Not sure if we want the dates to be calculated from the server. Prob yes, then if it needs to be
  //checked or converted for fees, we calculate their local time with our server time and send it back
  //the the front end in a converted local form.
  //Maybe for simplicity, we just make the date info come from the front end/the user's clock.
  //To do this, we must instantiate the Date() object on the client-side which refs the browser clock.
  const requiredFields = [
    "bookingDate",
    "checkIn",
    "checkOut",
    "guest",
    "host",
    "vehicles",
    "parking",
  ];
  //we can say if req.body.guest === req.userId || req.body.host === req.userId
  //This ensures that it's either the user that logged in or the owner of the lot that is logged in

  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!req.body[field]) {
      return res.send(`missing ${field} in request body!`);
    }
  }

  //grab userId that was injected by checkAuth and create the "host" key with it.
  req.body.guest = req.userId;

  //Calculate total cost here and then add it to the req.body.totalCost<-----------💣💣💣

  Booking.create(req.body)
    .then((prk) => {
      User.findById(req.userId).then((usr) => {
        const newArray = [...usr.parkings]; //creating a new parkings array that has all the user's old parking plus the new parking id we just created
        newArray.push(prk.id);

        User.findByIdAndUpdate(req.userId, { parkings: newArray }).then(() => {
          return res.status(201).json(prk);
        });
      });
    })
    .catch((err) => {
      const message = `Sorry, there was an issue creating the Parking :S`;
      return next({ err, message });
    });
}); //--------END

//Update parking using id
//Adding and deleting parking pictures will be handled on the front-end.
//We will be expecting an already-edited array of picture url strings.
router.patch("/:id", (req, res, next) => {
  console.log(`updating existing parking with id of ${req.params.id}`);

  Parking.findById(req.params.id)
    .then((parking) => {
      if (!parking) {
        return res.status(404).send(`No parking found by that id 😒...`);
      }
      if (parking.host.id !== req.userId) {
        return res.send(
          "Access Denied 🤬. You're not allowed to edit this parking."
        );
      }

      //Now that we verified the parking id exists and it is theirs, we can update
      const updateableFields = [
        "title",
        "description",
        "pictures",
        "spaces",
        "covered",
        "indoor",
        "address",
        "location",
        "terrain",
        "host",
        "pricePerHour",
        "extraFeatures",
      ];

      const updatedParking = {};

      updateableFields.forEach((field) => {
        if (req.body[field]) {
          updatedParking[field] = req.body[field];
        }
      });

      Parking.findByIdAndUpdate(req.params.id, updatedParking).then(() => {
        return res.status(200).send("update successful");
      });
    })
    .catch((err) => {
      let message =
        "Your id must be at least 24 characters long and only include numbers and letters (a through f)😒... ";

      return next({ err, message }); //laundry shoot
    });
});

//Delete parking using id
router.delete("/:id", (req, res, next) => {
  console.log(`Deleting parking with id of ${req.params.id}`);

  Parking.findById(req.params.id).then((parking) => {
    if (!parking) {
      return res.status(404).send(`No parking found by that id 😒...`);
    }
    if (parking.host.id !== req.userId) {
      return res.send(
        "Access Denied 🤬. You're not allowed to edit this parking."
      );
    } //--end of authorization

    //Now that we know it's the right user, lets open a session and start a transaction
    mongoose
      .startSession()
      .then((sess) => {
        sess.startTransaction();
        parking.remove({ session: sess }).then(() => {
          parking.host.parkings.pull(parking);
          parking.host.save({ session: sess }).then(() => {
            sess.commitTransaction().then(() => {
              return res.status(200).send("Successfully deleted the parking.");
            });
          });
        });
      })
      .catch((err) => {
        let message =
          "Sorry, could not delete the parking. Something went wrong. :S";
        return next(err);
      });
  }); //end of Parking.findById...
}); //end of delete

module.exports = router;
