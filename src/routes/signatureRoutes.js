const express = require("express");
const router = express.Router();
const {
  createSignature,
  getSignatures,
  updateSignatureStatus,
  getSignatureByBlockId
} = require("../controllers/signatureController");

// Routes
router.post("/create", createSignature);
router.get("/sign/:id", getSignatureByBlockId);
router.get("/:id", getSignatures);
router.put("/:id", updateSignatureStatus);

module.exports = router;
