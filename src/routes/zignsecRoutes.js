const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({ dest: "uploads/" });
const {
    startZignSecFlow
} = require("../controllers/zignsecController");

router.post("/create-session", upload.single("file"), startZignSecFlow);


module.exports = router;