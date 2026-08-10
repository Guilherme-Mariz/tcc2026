const express = require("express");

const router = express.Router();

const aiController = require("../controller/aiController.js");

router.post("/chat", (req, res) => aiController.chat(req, res));

module.exports = router;