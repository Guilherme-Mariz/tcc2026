const express = require("express");

const router = express.Router();

const childController =
    require("../controller/childController");

const verificarAuth =
    require("../middleware/authMiddleware.js");

router.get(
    "/children",
    verificarAuth,
    (req, res) => childController.getChildren(req, res)
);

module.exports = router;