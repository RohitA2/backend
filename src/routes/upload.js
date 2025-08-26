const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadFile } = require("../controllers/uploadController");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // save to uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});



const upload = multer({ storage });

// single file upload route
router.post("/img", upload.single("file"), uploadFile);

module.exports = router;
