const express = require("express");
const router = express.Router();
const coverController = require("../controllers/coverBlocks");

router.post("/CreateCoverBlock", coverController.createCoverBlock);
router.get("/coverBlock/:blockId", coverController.getCoverBlocksByblockId);

module.exports = router;
