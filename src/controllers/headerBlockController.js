// controllers/headerBlockController.js
const db = require("../config/database");

// controllers/headerBlock.controller.js
exports.createHeaderBlock = async (req, res) => {
  try {
    const {
      id, // block ID from frontend
      layoutType,
      title,
      subtitle,
      clientName,
      senderName,
      price,
      logo,
      backgroundImage,
      backgroundColor,
      textColor,
      backgroundFilter,
      textAlign,
      leftWidth,
      userId,
    } = req.body;

    console.log("Request Body:", req.body.userId);
    

    // Extract styles into a JSON object
    const styles = {
      layoutType,
      backgroundColor,
      textColor,
      backgroundImage,
      backgroundFilter,
      textAlign,
      leftWidth,
      clientName,
      senderName,
      price,
    };

    const block = await db.models.HeaderBlock.create({
      id: id || undefined, // Use provided ID or let DB generate
      logoUrl: logo,
      imageUrl: backgroundImage,
      title: title || "Sales Proposal",
      subtitle: subtitle || "Optional",
      styles,
      userId: userId || 1, // Get from auth middleware
    });

    res.status(201).json({
      success: true,
      message: "Header block created successfully",
      data: block,
    });
  } catch (error) {
    console.error("Error creating header block:", error);
    res.status(500).json({
      success: false,
      message: "Error creating header block",
      error: error.message,
    });
  }
};

// Get header block by ID
exports.getHeaderBlock = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Request Body:", req.params.id);
    
    const block = await db.models.HeaderBlock.findByPk(id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Header block not found",
      });
    }

    res.json({
      success: true,
      data: block,
    });
  } catch (error) {
    console.error("Error fetching header block:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching header block",
      error: error.message,
    });
  }
};

// Update header block
exports.updateHeaderBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log("Request Body:", req.body.userId);

    // Extract styles if they exist
    if (updateData.styles) {
      updateData.styles = { ...updateData.styles };
    }

    const block = await db.models.HeaderBlock.findByPk(id);
    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Header block not found",
      });
    }

    await block.update(updateData);

    res.json({
      success: true,
      message: "Header block updated successfully",
      data: block,
    });
  } catch (error) {
    console.error("Error updating header block:", error);
    res.status(500).json({
      success: false,
      message: "Error updating header block",
      error: error.message,
    });
  }
};

// exports.getHeaderBlocks = async (req, res) => {
//   try {
//     const blocks = await db.models.HeaderBlock.findAll();
//     res.json(blocks);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching blocks", error });
//   }
// };
