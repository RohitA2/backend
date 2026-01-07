const express = require("express");
const router = express.Router();
const {
  createSignature,
  getSignatures,
  updateSignatureStatus,
  getSignatureByBlockId,
  DeclineSignature,
  UserSelfSign
} = require("../controllers/signatureController");

// Routes
router.post("/create", createSignature);
router.get("/sign/:id", getSignatureByBlockId);
router.get("/:id", getSignatures);
router.post("/:id", updateSignatureStatus);
router.put("/decline/:id", DeclineSignature);
router.post("/self/status", UserSelfSign);

module.exports = router;
