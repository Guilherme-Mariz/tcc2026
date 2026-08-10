const express = require("express");

const router = express.Router();

const aiController = require("../controller/aiController");
const verificarAuth = require("../middleware/authMiddleware");

router.post(
    "/chat",
    verificarAuth,
    (req, res) => aiController.chat(req, res)
);

module.exports = router;