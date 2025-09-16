// routes/pricingServiceRoutes.js
const express = require("express");
const router = express.Router();
const pricingServiceController = require("../controllers/pricingServiceController");

router.post("/service", pricingServiceController.createBlock);
router.get("/blocks/:userId", pricingServiceController.getBlocksByUser);
router.get("/:id", pricingServiceController.getBlockByBlockId);

module.exports = router;
