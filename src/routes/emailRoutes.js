const express = require("express");
const { sendProposalEmail,updateExpirationDate } = require("../controllers/emailController");

const router = express.Router();

// Send base64 image directly
router.post("/send-email", sendProposalEmail);


router.post("/updateExpireDate", updateExpirationDate);



module.exports = router;
