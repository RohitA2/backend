const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/database");
const router = express.Router();

const pdfUploadPath = path.join(process.cwd(), "uploads/pdf");
if (!fs.existsSync(pdfUploadPath)) {
  fs.mkdirSync(pdfUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pdfUploadPath),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    console.log("Multer file:", req.file); // ✅ check multer got it
    console.log("Body:", req.body);

    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const pdfUrl = `/uploads/pdf/${req.file.filename}`;

    const saved = await db.models.PdfBlock.create({
      blockId: req.body.blockId,
      user_id: req.body.user_id,
      pdf: pdfUrl,
      filename: req.file.filename
    });

    res.json({ success: true, data: saved, message: "PDF saved successfully" ,id:saved.id});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


//by pdfId
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pdfBlock = await db.models.PdfBlock.findOne({ where: { id } });
    res.json({ success: true, data: pdfBlock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
