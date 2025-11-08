const express = require("express");
const { sendProposalEmail,updateExpirationDate, sendReminder } = require("../controllers/emailController");

const router = express.Router();

// Send base64 image directly
router.post("/send-email", sendProposalEmail);


router.post("/updateExpireDate", updateExpirationDate);


router.post("/remind",sendReminder)



module.exports = router;
