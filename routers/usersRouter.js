"use strict";
const express = require("express");
const {
  getUserById,
  getAllUsers,
  createNewUser,
  login,
  updateUser,
  deleteUser,
} = require("../controllers/usersController");
const { checkAuth } = require("../middleware/checkAuth");
const router = express.Router();

//GET BY ID
router.get("/:id", getUserById);

//GET ALL
router.get("/", getAllUsers);

//CREATE
router.post("/signup", createNewUser); //---end of post route----

//LOGIN
router.post("/login", login);

router.use(checkAuth); //MIDDLEWARE <--------------------------------

//UPDATE - AUTHENTICATION
router.patch("/:id", updateUser);

//DELETE - AUTHENTICATION
router.delete("/:id", deleteUser);

module.exports = router;
