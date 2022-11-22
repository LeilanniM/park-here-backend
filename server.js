"use strict";

//imports
const express = require("express");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise; //making mongoose use JS promise instead of its own promise-like object
const morgan = require("morgan");
const helmet = require("helmet"); //helps to hide sensitive header info
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { DATABASE_URL, PORT } = require("./config");

const usersRouter = require("./routers/usersRouter");
const parkingsRouter = require("./routers/parkingsRouter");

//create the express app
const app = express();

//apply middleware
app.use(morgan("common")); //log the http layer
app.use(express.json()); //parse incoming json data from any POST or PUT request's body
app.use(cookieParser());
app.use(cors());

//routes
app.use("/users", usersRouter);
app.use("/parkings", parkingsRouter);

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
