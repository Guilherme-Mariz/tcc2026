const userController = require("../controller/userController");

const loginLimiter = require("../middleware/loginLimiter");

const path = require("path");
const express = require('express');
const router = express.Router();


router.post("/login", loginLimiter, userController.login);

router.post("/register", userController.registerCompleto);


router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../view/pages/register.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../view/pages/login.html"));
});


module.exports = router; 