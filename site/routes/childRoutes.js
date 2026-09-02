const express = require("express");

const router = express.Router();

const childController =
    require("../controller/childController");

const verificarAuth =
    require("../middleware/authMiddleware.js");

const pinLimiter =
    require("../middleware/pinLimiter.js");

router.get(
    "/children",
    verificarAuth,
    (req, res) => childController.getChildren(req, res)
);

router.post(
    "/verify-pin",
    verificarAuth,
    pinLimiter,
    (req, res) => childController.verifyPin(req, res)
);

module.exports = router;

