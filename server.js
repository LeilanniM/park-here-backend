"use strict";

//imports
const express = require("express");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise; //making mongoose use JS promise instead of its own promise-like object
const morgan = require("morgan");
const helmet = require("helmet"); //helps to hide sensitive header info
const cookieParser = require("cookie-parser");
const cors = require("cors");

const imgbbUploader = require("imgbb-uploader");

const { DATABASE_URL, PORT } = require("./config");

const usersRouter = require("./routers/usersRouter");
const parkingsRouter = require("./routers/parkingsRouter");
const bookingsRouter = require("./routers/bookingsRouter");
const { checkAuth } = require("./middleware/checkAuth");
const { updateAvatar } = require("./controllers/usersController");
const { User } = require("./models/user");
const { Parking } = require("./models/Parking");

//create the express app
const app = express();

//apply middleware
app.use(morgan("common")); //log the http layer
app.use(express.json()); //parse incoming json data from any POST or PUT request's body
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//Rolled out our own Cors middleware
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   res.setHeader("Access-Control-Allow-Origin", origin);
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "*",
//     "Content-Type, Content-Length, Origin, X-Requested-With, Accept, Authorization"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET,POST,PUT,PATCH,DELETE, OPTIONS"
//   );
//   next();
// });

app.post("/avatar/:userId/", (req, res, next) => {
  const options = {
    apiKey: "cacaa3c91ff066da98b3a1e60e1fe8d0", // MANDATORY apikey for imgBB
    base64string: req.body.base64string,
    // OPTIONAL: pass base64-encoded image (max 32Mb)
  };
  imgbbUploader(options)
    .then((response) => {
      console.log(response);
      User.findByIdAndUpdate(req.params.userId, { image: response.url }).then(
        (usr) => {
          return res.status(200).json({
            message: "Updated user successfully",
            image: response.url,
          });
        }
      );
    })
    .catch((error) => console.error(error));
});

//route for posting parking images
app.post("/parking/images/:parkingId", (req, res, next) => {
  console.log("reached parking/images/:parkingId");
  const options = {
    apiKey: "cacaa3c91ff066da98b3a1e60e1fe8d0", // MANDATORY apikey for imgBB
    base64string: req.body.base64string,
    // OPTIONAL: pass base64-encoded image (max 32Mb)
  };
  imgbbUploader(options)
    .then((response) => {
      console.log(response);
      Parking.findByIdAndUpdate(req.params.parkingId, {
        pictures: response.url,
      }).then((parking) => {
        return res.status(200).json({
          message: "Updated parking successfully",
          image: response.url,
        });
      });
    })
    .catch((error) => console.error(error));
});

//routes
app.use("/users", usersRouter);
app.use("/parkings", parkingsRouter);
app.use("/bookings", bookingsRouter);

//---------🍳🍳🍳big catch-all drip pan-------
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(500).json(error);
}); //end of error handler

mongoose.connect(DATABASE_URL, () => {
  app.listen(PORT, () => {
    console.log(`🦦🌴🍟Listening on port ${PORT}`);
  });
});
