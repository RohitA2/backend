const express = require("express");
const router = express.Router();
const {
  createSignature,
  getSignatures,
  updateSignatureStatus,
} = require("../controllers/signatureController");

// Routes
router.post("/sign", createSignature);
router.get("/", getSignatures);
router.put("/:id", updateSignatureStatus);

module.exports = router;
