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

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|jfif|mp3|mp4|mov|avi|mkv/; // Allowed extensions
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // Accept the file
  } else {
    cb("Error: Only images are allowed!");
  }
};

const upload = multer({ storage, fileFilter });

// single file upload route
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
