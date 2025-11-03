const express = require("express");
const multer = require("multer");
const path = require("path");
const { createSignSession } = require("../controllers/signicat.controller");

const router = express.Router();
  
// 🧩 Configure multer for temporary uploads
const upload = multer({
  dest: path.join(__dirname, "../uploads"),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

router.post("/signicat/create-session", upload.single("pdf"), createSignSession);

module.exports = router;
