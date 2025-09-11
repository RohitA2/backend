// backend/routes/scheduleRoutes.js
const express = require("express");
const {
  createSchedule,
  getSchedules,
  getScheduleById,
  deleteSchedule,
  getScheduleByBlockId,
} = require("../controllers/scheduleController");

const router = express.Router();

router.post("/save", createSchedule); // Create
router.get("/", getSchedules); // List all
router.get("/:id", getScheduleById); // Get by ID
router.delete("/:id", deleteSchedule); // Delete
router.get("/sign/:id", getScheduleByBlockId);

module.exports = router;
