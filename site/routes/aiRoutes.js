const express = require("express");

const router = express.Router();

const aiController = require("../controllers/aiController");

router.post("/chat", (req, res) => aiController.chat(req, res));

module.exports = router;