// routes/headerBlock.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/headerBlockController");

router.post("/CreateHeaderBlock", controller.createHeaderBlock);
router.get("/headerBlock", controller.getHeaderBlock);
router.put("/headerBlock/:id", controller.updateHeaderBlock);

module.exports = router;