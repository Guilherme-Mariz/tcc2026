const path = require("path");
const express = require('express');
const router = express.Router();

const authController = require("../controller/userController");
const userController = require("../controller/userController")

const loginLimiter = require("../middleware/loginLimiter")

router.post("/login", loginLimiter, authController.login);

router.post("/register", userController.registerCompleto);


router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../view/pages/register.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../view/pages/login.html"));
});


module.exports = router; 