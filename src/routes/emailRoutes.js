const express = require("express");
const { sendProposalEmail } = require("../controllers/emailController");

const router = express.Router();

// Send base64 image directly
router.post("/send-email", sendProposalEmail);



module.exports = router;
