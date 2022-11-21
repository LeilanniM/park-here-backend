"use strict";
const express = require("express");
const router = express.Router();

//-->⛏️FIX: move to controller later
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User } = require("../models/user");
const { Parking } = require("../models/Parking");
const { JWT_KEY_SECRET, GOOGLE_API_KEY } = require("../config");
const { checkAuth } = require("../middleware/checkAuth");
const axios = require("axios");

//GET parking by id
router.get("/:id", (req, res, next) => {
  console.log(`getting user by id ${req.params.id}`);
  Parking.findById(req.params.id)
    .then((prk) => {
      if (!prk) {
        return res.status(404).send(`No parking found by that id 😒...`);
      }
      return res.status(200).json(prk.censorParking());
    })
    .catch((err) => {
      let message =
        "Your id must be at least 24 characters long and only include numbers and letters (a through f) 😒... ";
      return next({ err, message }); //laundry shoot
    });
});

//GET parkings
router.get("/", (req, res, next) => {
  console.log("getting all parkings");

  Parking.find()
    .then((parkings) => {
      return res
        .status(200)
        .json(parkings.map((parking) => parking.censorParking()));
    })
    .catch((err) => {
      const message = `Failed to fetch any parkings`;
      return next(err, message);
    });
});

router.use(checkAuth); //MIDDLEWARE <--------------------------------

//POST new parking
router.post("/", (req, res, next) => {
  console.log("creating new parking");
  const requiredFields = [
    "title",
    "description",
    "spaces",
    "address",
    "location",
  ];

  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!req.body[field]) {
      return res.send(`missing ${field} in request body!`);
    }
  }

  //grab userId that was injected by checkAuth and create the "host" key with it.
  req.body.host = req.userId;

  //-------here is the code to get the coordinates from a string address...
  // axios
  //   .get(
  //     `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(req.body.address)}&key=${GOOGLE_API_KEY}`
  //   )
  //   .then((response) => {
  //     console.log(response.data.results[0].geometry.location);
  //     req.body.location = response.data.results[0].geometry.location; <--adding the location property to req.body which holds the coordinates.

  // **⛏️----INSERT THE REST OF THE CODE IN HERE like Parking.create(...) and fix the array code for host to use push instead of User..... ----**

  //   });
  //---------end of get coordinates

  Parking.create(req.body)
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
