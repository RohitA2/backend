const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/database");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "attachments");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

router.post("/upload", upload.array("files", 10), async (req, res) => {
  try {
    const { blockId, user_id, displayNames = [], originalNames = [] } = req.body;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const created = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const rec = await db.models.Attachment.create({
        blockId,
        user_id,
        originalName: Array.isArray(originalNames) ? originalNames[i] : originalNames,
        displayName: Array.isArray(displayNames) ? displayNames[i] : displayNames,
        filename: f.filename,
        path: `/uploads/attachments/${f.filename}`,
        mime: f.mimetype,
        size: f.size,
      });
      created.push(rec);
    }

    res.json({ success: true, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});



// route to get all basis of blockid
router.get("/data/:blockId", async (req, res) => {
  try {
    const { blockId } = req.params;
    const attachments = await db.models.Attachment.findAll({ where: { blockId } });
    res.json({ success: true, data: attachments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
