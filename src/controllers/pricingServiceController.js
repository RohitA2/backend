const db = require("../config/database");

// Create or update block with items
exports.createBlock = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      blockId,
      userId,
      parentId,
      title,
      packageName,
      packageDescription,
      currency,
      pricingType,
      netTotal,
      vat,
      rutDiscount,
      rounding,
      total,
      items,
      envTax,
      rotDiscount,
    } = req.body;

    // 1. Check if block already exists
    let block = await db.models.PricingServiceBlock.findOne({
      where: { blockId, userId, parentId },
      transaction: t,
    });

    if (block) {
      // 2a. Update block
      await block.update(
        {
          title,
          packageName,
          packageDescription,
          currency,
          pricingType,
          netTotal,
          vat,
          rutDiscount,
          rounding,
          total,
          envTax,
          rotDiscount,
        },
        { transaction: t }
      );

      // 2b. Remove old items by INT PK (id)
      await db.models.PricingServiceItem.destroy({
        where: { blockId: block.id },
        transaction: t,
      });

      // 2c. Insert new items
      if (items && items.length > 0) {
        await db.models.PricingServiceItem.bulkCreate(
          items.map((item) => ({
            ...item,
            blockId: block.id, // ✅ use PK id, not blockId string
          })),
          { transaction: t }
        );
      }
    } else {
      // 3. Create new block with nested items
      block = await db.models.PricingServiceBlock.create(
        {
          blockId,
          userId,
          parentId,
          title,
          packageName,
          packageDescription,
          currency,
          pricingType,
          netTotal,
          vat,
          rutDiscount,
          rounding,
          total,
          items: items || [],
          envTax,
          rotDiscount,
        },
        {
          include: [{ model: db.models.PricingServiceItem, as: "items" }],
          transaction: t,
        }
      );
    }

    // 4. Commit + reload
    await t.commit();

    const freshBlock = await db.models.PricingServiceBlock.findOne({
      where: { blockId },
      include: [{ model: db.models.PricingServiceItem, as: "items" }],
    });

    res.json({ success: true, data: freshBlock });
  } catch (error) {
    await t.rollback();
    console.error("Error creating/updating block:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch all blocks by user
exports.getBlocksByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const blocks = await db.models.PricingServiceBlock.findAll({
      where: { userId },
      include: [{ model: db.models.PricingServiceItem, as: "items" }],
    });

    res.json({ success: true, data: blocks });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch block by blockId (external string id)
exports.getBlockByBlockId = async (req, res) => {
  try {
    const { id } = req.params;

    const block = await db.models.PricingServiceBlock.findOne({
      where: { blockId: id },
      include: [{ model: db.models.PricingServiceItem, as: "items" }],
    });

    res.json({ success: true, data: block });
  } catch (error) {
    console.error("Error fetching block:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
