const express = require("express");
const router = express.Router();
const recipientController = require("../controllers/recipientController");

router.post("/create", recipientController.createRecipient);
router.get("/leave/:id", recipientController.getRecipient);
router.put("recipients/:id", recipientController.updateRecipient);
router.delete("/:id", recipientController.deleteRecipient);
router.get("/recipients", recipientController.listRecipients);

module.exports = router;
