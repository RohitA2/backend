// routes/parties.js
const express = require("express");
const { saveParties, getParties, getPartiesById } = require("../controllers/partiesController");

const router = express.Router();

router.post("/save", saveParties);
router.get("/:userId", getParties);
router.get("/block/:id", getPartiesById);

module.exports = router;
