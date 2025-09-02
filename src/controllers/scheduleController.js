// Create schedule
const db = require("../config/database");
exports.createSchedule = async (req, res) => {
  try {
    const { date, time, userId ,blockId} = req.body;
    // console.log(" i am from blockId:", blockId);
    
    if (!date || !time || !userId) {
      return res.status(400).json({ error: "Date and time are required" });
    }

    const newSchedule = await db.models.Schedule.create({ date, time, userId, blockId });
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
