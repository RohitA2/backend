const express = require("express");
const router = express.Router();
const textBlockController = require("../controllers/textBlockController");

router.post(
  "/createorupdatetextblock",
  textBlockController.createOrUpdateTextBlock
);
router.get("/:blockId/:parentId", textBlockController.getTextBlock);

module.exports = router;
