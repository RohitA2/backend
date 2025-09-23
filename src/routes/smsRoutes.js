const express = require("express");
const router = express.Router();
const smsController = require("../controllers/smsController");

// Send SMS
router.post("/send", smsController.sendSMS);

// Receive SMS webhook
router.post("/incoming", smsController.receiveSMS);

module.exports = router;
