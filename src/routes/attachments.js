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

router.delete("/remove/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Attachment ID for remove:", id);

    const attachment = await db.models.Attachment.findByPk(id);

    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }

    const filePath = path.join(UPLOAD_DIR, attachment.filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    await attachment.destroy();

    res.json({ success: true, message: "Attachment removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// In your attachments router file (e.g., attachments.js)
router.patch("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName } = req.body;

    const attachment = await db.models.Attachment.findByPk(id);
    if (!attachment) {
      return res.status(404).json({ success: false, message: "Attachment not found" });
    }

    attachment.displayName = displayName;
    await attachment.save();
    // console.log("Attachment updated successfully:", attachment);

    res.json({ success: true, data: attachment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;