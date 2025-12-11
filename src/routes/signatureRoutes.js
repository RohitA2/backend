const express = require("express");
const router = express.Router();
const {
  createSignature,
  getSignatures,
  updateSignatureStatus,
  getSignatureByBlockId,
  DeclineSignature
} = require("../controllers/signatureController");

// Routes
router.post("/create", createSignature);
router.get("/sign/:id", getSignatureByBlockId);
router.get("/:id", getSignatures);
router.post("/:id", updateSignatureStatus);
router.put("/decline/:id", DeclineSignature);

module.exports = router;
