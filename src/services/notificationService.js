// notificationService.js
const admin = require("../firebaseAdmin");

async function sendNotificationToToken(token, title, body, data = {}) {
    try {
        const message = {
            token,
            notification: { title, body },
            data,
            android: { priority: "high" },
            webpush: { headers: { Urgency: "high" } },
        };

        const response = await admin.messaging().send(message);
        console.log("✅ Notification sent:", response);
    } catch (error) {
        console.error("❌ Error sending notification:", error);
    }
}

module.exports = { sendNotificationToToken };
