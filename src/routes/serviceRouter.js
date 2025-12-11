const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/servicesControlller");

router.post("/Create", serviceController.createService);
router.get("/:userId", serviceController.getAllServices);

module.exports = router;