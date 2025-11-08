const admin = require("./../firebaseAdmin");

const sendNotification = async (fcmToken, title, body, data = {}) => {
    try {
        const message = {
            notification: { title, body },
            data,
            token: fcmToken,
        };

        const response = await admin.messaging().send(message);
        console.log("✅ Notification sent:", response);
        return true;
    } catch (error) {
        console.error("❌ Error sending notification:", error.message);
        return false;
    }
};

module.exports = sendNotification;
