"use strict";
const express = require("express");

//-->⛏️FIX: move to controller later
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User } = require("../models/user");
const { JWT_KEY_SECRET } = require("../config");

//Instead of using mongoose's promise-like system, we'll be using Javascript's promise system:
mongoose.Promise = global.Promise;

//----------------------GET User By Id----------------
const getUserById = (req, res, next) => {
  console.log(`getting user by id ${req.params.id}`);

  User.findById(req.params.id)
    .then((usr) => {
      return res.status(200).json(usr.censorUserInfo());
    })
    .catch((err) => {
      return next(err); //laundry shoot
    });
}; //------------------🏁end of getuserbyid🏁-----------

//---------------------GET All Users----------------------
const getAllUsers = (req, res, next) => {
  console.log("getting all users");
  User.find()
    .then((users) => {
      return res.status(200).json(users.map((usr) => usr.censorUserInfo()));
    })
    .catch((err) => {
      //🧺laundry shoot
      return next(err);
    });
}; //------------------END🏁

//POST New User
const createNewUser = (req, res, next) => {
  //req body validation
  const requiredFields = ["firstName", "lastName", "email", "password"];

  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!req.body[field]) {
      return res.send(`missing ${field} in request body!`);
    }
  } //end of field validation

  //normalize email/make lowercase.
  req.body.email = req.body.email.toLowerCase();

  //CHECK IF USER EXISTS FIRST (fix this)⛏

  //encryt password
  bcrypt.hash(req.body.password, 12).then((encryptedPw) => {
    console.log(`Finished encrypting password: ${encryptedPw}`);
    req.body.password = encryptedPw;

    User.create(req.body)
      .then((usr) => {
        const token = jwt.sign(
          { userId: usr.id, email: usr.email },
          JWT_KEY_SECRET,
          { expiresIn: "2h" }
        ); //server watermark is the second argument

        return res.status(201).json({ ...usr.censorUserInfo(), token });
      })
      .catch((err) => {
        //🧺laundry shoot
        let message;
        if (err.code === 11000) {
          message = "looks like that email already exists.";
        }
        return next({ err, message });
      });
  });

  //post new user
}; //---------------------------END🏁🏁

//LOGIN User
const login = (req, res, next) => {
  console.log("logging in existing user");
  req.body.email = req.body.email.toLowerCase();

  //check if user exists by querying for email
  User.findOne({ email: req.body.email }).then((usr) => {
    if (!usr) {
      return res.send(`no user found with that email bruh 📧.`);
    }

    //usr exists, now lets decrypt password.
    console.log(` comparing ${req.body.password} to ${usr.password}`);

    bcrypt.compare(req.body.password, usr.password).then((compareResult) => {
      if (!compareResult) {
        return res.send(`Invalid creds brah 😒...`);
      }

      //since compareResult is true, we now generate a login token
      const token = jwt.sign(
        { userId: usr.id, email: usr.email },
        JWT_KEY_SECRET
      );

      // return res.status(200).cookie("access_token", token).json(usr);
      return res.status(201).json({ ...usr.censorUserInfo(), token });
    });
  });
}; //---------------------------------END🏁🏁-----------

//UPDATE User
const updateUser = (req, res, next) => {
  console.log(`updating existing user with id of ${req.params.id}`);
  console.log(req.userId);
  if (req.userId !== req.params.id) {
    return res.send("Access Denied 🤬. You're not the correct user.");
  }

  //check if user id exists
  User.findById(req.params.id)
    .then((usr) => {
      if (!usr) {
        return res.status(404).send(`No user found by that id 😒...`);
      }

      //user exists, now check the fields to make sure they are updateable
      const updatableFields = ["firstName", "lastName", "image"];
      const newUser = {};
      updatableFields.forEach((field) => {
        if (req.body[field]) {
          newUser[field] = req.body[field];
        }
      });

      //Now find the user by id and update
      User.findByIdAndUpdate(req.params.id, newUser).then((usr) => {
        return res.status(200).send("Updated user successfully");
      });
    })
    .catch((err) => {
      //🧺laundry shoot
      let message = "Failed to update user. Sorry about that. :S";
      return next({ err, message });
    });
}; //--------------END

//UPDATE User AVATAR
const updateAvatar = (req, res, next) => {
  const options = {
    apiKey: "cacaa3c91ff066da98b3a1e60e1fe8d0", // MANDATORY apikey for imgBB
    base64string: req.body.base64string,
    // OPTIONAL: pass base64-encoded image (max 32Mb)
  };
  imgbbUploader(options)
    .then((response) => {
      // res.json(response);
      console.log(response);
      //Now find the user by id and update
      User.findByIdAndUpdate(req.params.userId, { image: response }).then(
        (usr) => {
          return res.status(200).send("Updated user successfully");
        }
      );
    })
    .catch((error) => console.error(error));
};

//DELETE User
const deleteUser = (req, res, next) => {
  console.log(`Deleting user with id of ${req.params.id}`);
  if (req.userId !== req.params.id) {
    return res.send("Access Denied 🤬. You're not the correct user.");
  }

  //check if user id exists
  User.findById(req.params.id)
    .then((usr) => {
      if (!usr) {
        return res.status(404).send(`No user found by that id 😒...`);
      }

      //Now find the user by id and DELETE
      User.findByIdAndDelete(req.params.id).then(() => {
        return res
          .status(200)
          .send(`Successfully deleted user with id of ${req.params.id}`);
      });
    })
    .catch((err) => {
      //🧺laundry shoot
      let message = "Failed to deleter user. Sorry about that. :S";
      return next({ err, message });
    });
}; //------------------------------END

module.exports = {
  getUserById,
  getAllUsers,
  createNewUser,
  login,
  updateUser,
  deleteUser,
  updateAvatar,
};
