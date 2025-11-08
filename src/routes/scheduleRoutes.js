// backend/routes/scheduleRoutes.js
const express = require("express");
const {
  createSchedule,
  getSchedules,
  getScheduleById,
  deleteSchedule,
  getScheduleByBlockId,
  updateSchedule,
  scheduleByUserId,
  getProposalsByUserId,
  fcmToken,
  fcmTokenForRecipent,
  expiringProposals
} = require("../controllers/scheduleController");


const router = express.Router();

router.post("/save", createSchedule); // Create
router.get("/", getSchedules); // List all
router.get("/:id", getScheduleById); // Get by ID
router.delete("/:id", deleteSchedule); // Delete
router.get("/sign/:id", getScheduleByBlockId);
router.post("/updateSchedule", updateSchedule);
router.get("/user/:id", scheduleByUserId);
router.get("/manage/:id", getProposalsByUserId);
router.post("/save-fcm-token",fcmToken)
router.post("/save-fcm-token-recipent",fcmTokenForRecipent)
router.get("/expiryDate/log", expiringProposals);

module.exports = router;
