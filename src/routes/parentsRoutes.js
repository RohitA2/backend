const express = require("express");
const router = express.Router();
const parentsController = require("../controllers/parentsController");

// Create a new parent
router.post("/CreateParent", parentsController.createParent);

// Upsert block order
router.post("/:parentId/blocks/order", parentsController.upsertOrder);

// Delete a block
router.delete("/:parentId/blocks/:blockId", parentsController.deleteBlock);

// Get block IDs
router.get("/:parentId/block-ids", parentsController.getBlockIds);

// Get all blocks
router.get("/:parentId/blocks", parentsController.getBlocks);

module.exports = router;
