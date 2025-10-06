// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { createNotification } = require("../utils/notify");

// Create a notification
router.post("/notify", async (req, res) => {
  try {
    const notification = await createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notifications (optionally for a specific user)
router.get("/AllNotifications", async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId } : {};
    const notifications = await db.models.Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
router.patch("/:id/read", async (req, res) => {
  try {
    const notification = await db.models.Notification.findByPk(req.params.id);
    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.models.Notification.destroy({
      where: { id: req.params.id },
    });
    if (result === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
