// controllers/parentsController.js
const db = require("../config/database");
const { sequelize } = require("../config/database");
const { Op } = require("sequelize");
const Sequelize = require("sequelize");

// exports.createParent = async (req, res) => {
//   try {
//     const { user_id, company_id } = req.body || {};
//     console.log(
//       "userId +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++",
//       user_id
//     );

//     const parent = await db.models.Parent.create({ user_id, companyId: company_id });
//     res.status(201).json({ id: parent.id });
//   } catch (e) {
//     console.error("Failed to create parent:", e);
//     res.status(500).json({ message: "Failed to create parent" });
//   }
// };


exports.createParent = async (req, res) => {
  try {
    let { user_id, company_id } = req.body || {};

    // 🔥 Convert "null" string → actual null
    if (company_id === "null" || company_id === undefined) {
      company_id = null;
    }

    const parent = await db.models.Parent.create({
      user_id,
      company_id, // ✅ correct column name
    });

    res.status(201).json({ message: "Parent Created Succesfully", id: parent.id });
  } catch (e) {
    console.error("Failed to create parent:", e);
    res.status(500).json({ message: "Failed to create parent" });
  }
};

// POST /parents/:parentId/blocks/order
// exports.upsertOrder = async (req, res) => {
//   const { parentId } = req.params;
//   console.log("parentId from upsertOrder", parentId);

//   const { blocks } = req.body || {};
//   console.log("blocks from upsertOrder", blocks);
//   if (!Array.isArray(blocks))
//     return res.status(400).json({ message: "blocks must be an array" });

//   const t = await sequelize.transaction();
//   try {
//     const parent = await db.models.Parent.findByPk(parentId, {
//       transaction: t,
//     });
//     if (!parent) {
//       await t.rollback();
//       return res.status(404).json({ message: "Parent not found" });
//     }

//     const incomingBlockIds = blocks.map((b) => String(b.id)); // client blockId
//     const existing = await db.models.Block.findAll({
//       where: { parentId },
//       transaction: t,
//     });

//     const existingByBlockId = new Map(
//       existing.map((b) => [String(b.blockId), b])
//     );

//     for (const { id, type, name, orderIndex, settings } of blocks) {
//       const clientBlockId = String(id);
//       const found = existingByBlockId.get(clientBlockId);
//       const payload = {
//         parentId,
//         blockId: clientBlockId,
//         type: type || found?.type || "unknown",
//         name: name ?? found?.name ?? null,
//         orderIndex: Number(orderIndex) || 0,
//         settings: settings ?? found?.settings ?? {},
//       };

//       if (found) {
//         await found.update(payload, { transaction: t });
//       } else {
//         await db.models.Block.create(payload, { transaction: t });
//       }
//     }

//     // delete missing
//     const toDelete = existing.filter(
//       (b) => !incomingBlockIds.includes(String(b.blockId))
//     );
//     for (const b of toDelete) {
//       await b.destroy({ transaction: t });
//     }

//     await t.commit();
//     return res.json({ ok: true, count: blocks.length });
//   } catch (e) {
//     await t.rollback();
//     console.error("Failed to upsert block order:", e);
//     return res.status(500).json({ message: "Failed to upsert block order" });
//   }
// };

exports.upsertOrder = async (req, res) => {
  const { parentId } = req.params;
  const { blocks } = req.body || {};

  if (!Array.isArray(blocks))
    return res.status(400).json({ message: "blocks must be an array" });

  const t = await sequelize.transaction();
  try {
    // First, delete all blocks for this parent
    await db.models.Block.destroy({
      where: { parentId },
      transaction: t,
    });

    // Then create all blocks with new order
    const blockPromises = blocks.map((block, index) => {
      return db.models.Block.create({
        parentId,
        blockId: String(block.id),
        type: block.type || "unknown",
        name: block.name ?? null,
        orderIndex: Number(block.orderIndex) || index,
        settings: block.settings || {},
      }, { transaction: t });
    });

    await Promise.all(blockPromises);
    await t.commit();

    return res.json({
      ok: true,
      count: blocks.length,
      message: "Blocks reordered successfully"
    });
  } catch (e) {
    await t.rollback();
    console.error("Failed to upsert block order:", e);
    return res.status(500).json({ message: "Failed to upsert block order" });
  }
};
exports.deleteBlock = async (req, res) => {
  const { parentId, blockId } = req.params;
  try {
    const block = await db.models.Block.findOne({
      where: { blockId: String(blockId), parentId },
    });
    if (!block) return res.status(404).json({ message: "Block not found" });
    await block.destroy();
    return res.json({ ok: true });
  } catch (e) {
    console.error("Failed to delete block:", e);
    return res.status(500).json({ message: "Failed to delete block" });
  }
};

exports.getBlockIds = async (req, res) => {
  const { parentId } = req.params;
  try {
    const rows = await db.models.Block.findAll({
      where: { parentId },
      attributes: ["blockId"], // Changed from "id" to "blockId"
      order: [["orderIndex", "ASC"]],
    });
    return res.json({ parentId, blockIds: rows.map((r) => r.blockId) });
  } catch (e) {
    console.error("Failed to fetch block ids:", e);
    return res.status(500).json({ message: "Failed to fetch block ids" });
  }
};

exports.getBlocks = async (req, res) => {
  const { parentId } = req.params;

  try {
    const parent = await db.models.Parent.findOne({
      where: { id: parentId },
      include: [
        {
          model: db.models.User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: db.models.Block,
          as: "blocks",
          order: [["orderIndex", "ASC"]],
        },
      ],
    });

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    return res.json({
      parentId: parent.id,
      title: parent.title,
      user: parent.user,
      blocks: parent.blocks,
    });
  } catch (e) {
    console.error("Failed to fetch blocks:", e);
    return res.status(500).json({ message: "Failed to fetch blocks" });
  }
};



/**
 * ✅ GET DRAFT PROPOSALS
 * Draft = Parent with NO proposal_emails
 */
exports.getDraftProposals = async (req, res) => {
  try {
    const { userId, companyId } = req.query;

    // 🔹 Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {
      "$proposals.id$": { [Op.is]: null }, // UNSENT = DRAFT
    };

    if (userId) whereClause.user_id = userId;
    if (companyId) whereClause.companyId = companyId;

    const drafts = await db.models.Parent.findAll({
      where: whereClause,
      attributes: {
        include: [
          [Sequelize.fn("COUNT", Sequelize.col("blocks.id")), "blockCount"],
        ],
      },
      include: [
        {
          model: db.models.ProposalEmail,
          as: "proposals",
          required: false,
          attributes: [],
        },
        {
          model: db.models.Block,
          as: "blocks",
          required: false,
          attributes: [],
        },
      ],
      group: ["Parent.id"],
      having: Sequelize.literal(`COUNT("blocks"."id") > 0`),
      order: [["created_at", "DESC"]],
      limit,
      offset,
      subQuery: false,
      distinct: true,
    });

    // 🔹 Total count (for pagination UI)
    const totalCountResult = await db.models.Parent.findAll({
      where: whereClause,
      include: [
        {
          model: db.models.Block,
          as: "blocks",
          required: true,
          attributes: [],
        },
        {
          model: db.models.ProposalEmail,
          as: "proposals",
          required: false,
          attributes: [],
        },
      ],
      group: ["Parent.id"],
      having: Sequelize.literal(`COUNT("blocks"."id") > 0`),
    });

    const total = totalCountResult.length;

    // 🔹 fetch blocks separately (keeps correct ordering)
    const parentIds = drafts.map((d) => d.id);

    const blocks = await db.models.Block.findAll({
      where: { parentId: parentIds },
      order: [["order_index", "ASC"]],
    });

    // 🔹 attach blocks back
    const blocksMap = {};
    blocks.forEach((b) => {
      if (!blocksMap[b.parentId]) blocksMap[b.parentId] = [];
      blocksMap[b.parentId].push(b);
    });

    const result = drafts.map((d) => ({
      ...d.toJSON(),
      blocks: blocksMap[d.id] || [],
    }));

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: result,
    });
  } catch (error) {
    console.error("Error fetching draft proposals:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch draft proposals",
    });
  }
};

/**
 * ❌ DELETE DRAFT PROPOSAL
 * Only deletes if proposal is still a draft (unsent)
 */
exports.deleteDraftProposal = async (req, res) => {
  try {
    const { parentId } = req.params;

    // Check if proposal has been sent
    const sentCount = await db.models.ProposalEmail.count({
      where: { parentId },
    });

    if (sentCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete. Proposal already sent.",
      });
    }

    const deleted = await db.models.Parent.destroy({
      where: { id: parentId },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Draft proposal not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Draft proposal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting draft proposal:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete draft proposal",
    });
  }
};
