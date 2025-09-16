// routes/coverBlocks.js
const express = require("express");
const db = require("../config/database");

exports.createCoverBlock = async (req, res) => {
  try {
    const { parentId, content, settings, blockId } = req.body;

    console.log("req.body", req.body);

    // Check if block already exists
    let existingBlock = await db.models.CoverBlock.findOne({
      where: { parentId, blockId },
    });

    let savedBlock;

    if (existingBlock) {
      // Update existing
      await existingBlock.update({ content, settings });
      savedBlock = existingBlock;
    } else {
      // Create new
      savedBlock = await db.models.CoverBlock.create({
        parentId,
        content,
        settings,
        blockId,
      });
    }

    res.json({ success: true, block: savedBlock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get by parentId
exports.getCoverBlocksByblockId = async (req, res) => {
  const { blockId } = req.params;
  console.log("blockId", blockId);

  try {
    const data = await db.models.CoverBlock.findOne({
      where: { blockId },
    });
    console.log("data", data);

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
