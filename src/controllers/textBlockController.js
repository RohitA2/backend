// controllers/textBlockController.js
const db = require("../config/database");
exports.createOrUpdateTextBlock = async (req, res) => {
  try {
    const { blockId, parentId, title, content } = req.body;

    let block = await db.models.TextBlock.findOne({
      where: { blockId, parentId },
    });

    if (block) {
      // Update existing
      block.title = title;
      block.content = content;
      await block.save();
    } else {
      // Create new
      block = await db.models.TextBlock.create({
        blockId,
        parentId,
        title,
        content,
      });
    }

    res.json({ success: true, block });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to save block" });
  }
};

exports.getTextBlock = async (req, res) => {
  try {
    const { blockId, parentId } = req.params;
    const data = await db.models.TextBlock.findOne({
      where: { blockId, parentId },
    });
    if (!data)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch block" });
  }
};
