const express = require("express");
const router = express.Router();
const videoBlockController = require("../controllers/videoBlockController");

// Create VideoBlock
router.post("/create", videoBlockController.createVideoBlock);

// Get all VideoBlocks by user
router.get("/user/:userId", videoBlockController.getVideoBlocksByUser);

// Get single VideoBlock
router.get("/:id", videoBlockController.getVideoBlockById);

module.exports = router;
