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

    // Step 1: Get all schedules for this user
    const schedules = await db.models.Schedule.findAll({
      where: { userId: id },
      transaction: t,
    });

    if (!schedules || schedules.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "No schedules found", error: "No schedules found" });
    }

    // Step 2: Extract parentIds from schedules
    const parentIds = schedules.map((s) => s.parentId).filter(Boolean);

    // Step 3: Fetch proposals linked via parentId
    const proposalEmails = await db.models.ProposalEmail.findAll({
      where: { parentId: parentIds },
      transaction: t,
    });

    await t.commit();

    // Step 4: Attach proposal details to schedules
    const combined = schedules.map((schedule) => {
      const proposal = proposalEmails.find(
        (p) => p.parentId === schedule.parentId
      );
      return {
        ...schedule.toJSON(),
        proposalEmail: proposal ? proposal.toJSON() : null,
      };
    });

    res.json({ success: true, data: combined });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};
