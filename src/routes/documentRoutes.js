// routes/documentRoutes.js
const express = require("express");
const { saveDocument, getDocuments } = require("../controllers/documentController");

const router = express.Router();

router.post("/save", saveDocument);
router.get("/", getDocuments);

module.exports = router;
