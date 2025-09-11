// routes/blockRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Create a new block
router.post("/save", async (req, res) => {
  try {
    const { blockId, parentId, title, content } = req.body;
    let terms = await db.models.TermsBlock.findOne({
      where: { blockId, parentId },
    });

    if (terms) {
      await terms.update({ title, content });
    } else {
      terms = await db.models.TermsBlock.create({
        blockId,
        parentId,
        title,
        content,
      });
    }

    res.json({ success: true, data: terms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get terms by blockId + parentId
router.get("/get/:blockId/:parentId", async (req, res) => {
  try {
    const { blockId, parentId } = req.params;
    const terms = await db.models.TermsBlock.findOne({
      where: { blockId, parentId },
    });

    if (!terms) {
      return res.json({ success: false, message: "Terms not found" });
    }
    res.json({ success: true, data: terms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

module.exports = router;
