const db = require("../config/database");
async function createNotification({
  title,
  message,
  type = "info",
  userId = null,
}) {
  try {
    const notification = await db.models.Notification.create({
      title,
      message,
      type,
      userId,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

module.exports = { createNotification };
