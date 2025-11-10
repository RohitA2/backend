// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const { createSignSession } = require("../controllers/signicat.controller");

// const router = express.Router();

// // 🧩 Configure multer for temporary uploads
// const upload = multer({
//   dest: path.join(__dirname, "../uploads"),
//   limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === "application/pdf") cb(null, true);
//     else cb(new Error("Only PDF files are allowed"));
//   },
// });

// router.post("/signicat/create-session", upload.single("pdf"), createSignSession);

// module.exports = router;


const express = require("express");
const multer = require("multer");
const path = require("path");
const { createSignSession } = require("../controllers/signicat.controller");

const router = express.Router();

const PDF_MIMES = new Set(["application/pdf"]);
const isPdfExt = (filename = "") => path.extname(filename).toLowerCase() === ".pdf";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const okMime = PDF_MIMES.has(file.mimetype);
    const okExt = isPdfExt(file.originalname || "");
    if (!okMime || !okExt) return cb(new Error("Only PDF files are allowed"));
    cb(null, true);
  },
});

const uploadSinglePdf = (req, res, next) =>
  upload.single("pdf")(req, res, (err) => {
    if (err) {
      const status = err.name === "MulterError" ? 413 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
    next();
  });

router.post("/signicat/create-session", uploadSinglePdf, createSignSession);

module.exports = router;

