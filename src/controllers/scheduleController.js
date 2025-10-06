// Create schedule
const e = require("cors");
const db = require("../config/database");
exports.createSchedule = async (req, res) => {
  try {
    const { date, time, userId, blockId, parentId } = req.body;
    // console.log(" i am from blockId:", blockId);

    if (!date || !time || !userId) {
      return res.status(400).json({ error: "Date and time are required" });
    }

    const newSchedule = await db.models.Schedule.create({
      date,
      time,
      userId,
      blockId,
      parentId,
    });
    res.status(201).json({
      message: "Schedule saved successfully",
      success: true,
      id: newSchedule.id,
      data: newSchedule,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await db.models.Schedule.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await db.models.Schedule.findByPk(id);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//get by blockId
exports.getScheduleByBlockId = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await db.models.Schedule.findAll({
      where: { blockId: id },
    });
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const deleted = await db.models.Schedule.destroy({
      where: { id: req.params.id },
    });
    if (!deleted) return res.status(404).json({ error: "Schedule not found" });
    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.scheduleByUserId = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    console.log("🔎 Request received for userId:", id);

    // Step 1: Get all schedules for this user
    const schedules = await db.models.Schedule.findAll({
      where: { userId: id },
      transaction: t,
    });

    console.log("📅 Schedules found:", schedules.length);

    if (!schedules || schedules.length === 0) {
      await t.rollback();
      return res.status(404).json({ message: "No schedules found for this user" });
    }

    // Step 2: Extract parentIds from schedules
    const parentIds = schedules.map((s) => s.parentId).filter(Boolean);
    console.log("📌 Extracted parentIds:", parentIds);

    if (parentIds.length === 0) {
      await t.commit();
      return res.json({
        success: true,
        message: "No parentIds found in schedules",
        data: [],
      });
    }

    // Step 3: Get all signatures with method sign or decline
    const validSignatures = await db.models.Signature.findAll({
      where: {
        parentId: parentIds,
        method: ["type", "decline"],
      },
      transaction: t,
    });

    console.log("✍️ Signatures found (sign/decline):", validSignatures.length);

    if (!validSignatures || validSignatures.length === 0) {
      await t.commit();
      return res.json({
        success: true,
        message: "No valid signatures found with method sign or decline",
        data: [],
      });
    }

    // Extract parentIds from valid signatures
    const validParentIds = [...new Set(validSignatures.map((sig) => sig.parentId))];
    console.log("✅ Valid parentIds from signatures:", validParentIds);

    if (validParentIds.length === 0) {
      await t.commit();
      return res.json({
        success: true,
        message: "No valid parentIds found from signatures",
        data: [],
      });
    }

    // Step 4: Fetch proposals for valid parentIds
    const proposalEmails = await db.models.ProposalEmail.findAll({
      where: { parentId: validParentIds },
      include: [
        {
          model: db.models.ProposalEmailRecipient,
          as: "recipients",
          include: [
            {
              model: db.models.Recipient,
              as: "recipientDetails",
            },
          ],
        },
        {
          model: db.models.User,
          as: "user",
        },
      ],
      transaction: t,
    });

    console.log("📨 ProposalEmails found:", proposalEmails.length);

    await t.commit();

    if (!proposalEmails || proposalEmails.length === 0) {
      return res.json({
        success: true,
        message: "No proposals found for valid parentIds",
        data: [],
      });
    }

    // Step 5: Combine schedules with matching proposals
    const combined = schedules
      .filter((schedule) => validParentIds.includes(schedule.parentId))
      .map((schedule) => {
        const proposal = proposalEmails.find(
          (p) => p.parentId === schedule.parentId
        );
        return {
          ...schedule.toJSON(),
          proposalEmail: proposal ? proposal.toJSON() : null,
        };
      });

    console.log("📦 Final combined records:", combined.length);

    return res.json({
      success: true,
      message: "Filtered schedules with sign/decline signatures",
      data: combined,
    });
  } catch (error) {
    console.error("❌ Error in scheduleByUserId:", error);
    await t.rollback();
    return res.status(500).json({ error: error.message });
  }
};


exports.getProposalsByUserId = async (req, res) => {
  try {
    const { id } = req.params;

    const userWithProposals = await db.models.User.findOne({
      where: { id },
      include: [
        {
          model: db.models.ProposalEmail,
          as: "proposalEmails",
          include: [
            {
              model: db.models.ProposalEmailRecipient,
              as: "recipients",
              include: [
                {
                  model: db.models.Recipient,
                  as: "recipientDetails",
                  attributes: ["id", "name", "phone"],
                },
              ],
            },
            {
              model: db.models.Schedule,
              as: "schedules",
              separate: true, // ensures proper sorting inside include
              order: [["createdAt", "DESC"]],
            },
            {
              model: db.models.Signature,
              as: "signatures",
              separate: true,
              order: [["createdAt", "DESC"]],
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
        {
          model: db.models.Schedule,
          as: "schedules",
          separate: true,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!userWithProposals) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Group proposals by parentId
    const grouped = {};
    userWithProposals.proposalEmails.forEach((proposal) => {
      const parentId = proposal.parentId || proposal.id;

      if (!grouped[parentId]) {
        grouped[parentId] = {
          parentId,
          proposals: [],
          recipients: [],
          schedules: [],
          signatures: [],
        };
      }

      grouped[parentId].proposals.push({
        id: proposal.id,
        proposalName: proposal.proposalName,
        fromName: proposal.fromName,
        fromEmail: proposal.fromEmail,
        expirationDate: proposal.expirationDate,
        link: proposal.link,
        createdAt: proposal.createdAt,
      });

      if (proposal.recipients)
        grouped[parentId].recipients.push(
          ...proposal.recipients.map((r) => ({
            ...r.toJSON(),
            recipientDetails: r.recipientDetails || null,
          }))
        );

      if (proposal.schedules)
        grouped[parentId].schedules.push(...proposal.schedules);

      if (proposal.signatures)
        grouped[parentId].signatures.push(...proposal.signatures);
    });

    // ✅ Sort proposals by createdAt DESC before sending
    const sortedGroupedProposals = Object.values(grouped).map((grp) => ({
      ...grp,
      proposals: grp.proposals.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
      schedules: grp.schedules.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
      signatures: grp.signatures.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    }));

    // ✅ Sort parent groups themselves by most recent proposal
    sortedGroupedProposals.sort((a, b) => {
      const aDate = a.proposals[0]?.createdAt || 0;
      const bDate = b.proposals[0]?.createdAt || 0;
      return new Date(bDate) - new Date(aDate);
    });

    res.json({
      success: true,
      user: {
        id: userWithProposals.id,
        firstName: userWithProposals.firstName,
        lastName: userWithProposals.lastName,
        email: userWithProposals.email,
        companyName: userWithProposals.companyName,
      },
      groupedProposals: sortedGroupedProposals,
      userSchedules:
        (userWithProposals.schedules || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ),
    });
  } catch (error) {
    console.error("❌ Error fetching proposals:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


