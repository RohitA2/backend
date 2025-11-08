// cron/proposalExpiryCron.js
const cron = require("node-cron");
const db = require("../config/database");
const sendNotification = require("../utils/sendNotification");
const sendExpiryEmail = require("../utils/sendExpiryEmail");
const { Op } = require("sequelize");

// 🕒 Run every day at 9:00 AM
cron.schedule("0 9 * * *", async () => {
    console.log("🕒 Running proposal expiry cron...");

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(startOfToday.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    console.log("📅 Checking proposals between:", startOfToday, "and", endOfTomorrow);

    try {
        const expiringProposals = await db.models.ProposalEmail.findAll({
            where: {
                expirationDate: {
                    [Op.between]: [startOfToday, endOfTomorrow],
                },
            },
            include: [
                {
                    model: db.models.Recipient,
                    as: "linkedRecipients",
                    attributes: ["id", "name", "email", "fcmToken"],
                },
            ],
        });

        console.log(`📄 Found ${expiringProposals.length} expiring proposals.`);

        // 🔁 Loop through proposals
        for (const proposal of expiringProposals) {
            for (const recipient of proposal.linkedRecipients || []) {
                // ✅ Send Email
                await sendExpiryEmail({
                    to: recipient.email,
                    name: recipient.name,
                    proposalName: proposal.proposalName,
                    expirationDate: proposal.expirationDate,
                    link: proposal.link, // 🔗 Added here
                    senderName: proposal.fromName,
                    senderEmail: proposal.fromEmail
                });

                // ✅ Send Push Notification
                if (recipient.fcmToken) {
                    const title = "⚠️ Proposal Expiry Reminder";
                    const body = `Hi ${recipient.name || "User"}, your proposal "${proposal.proposalName}" will expire soon.`;

                    await sendNotification(recipient.fcmToken, title, body, {
                        proposalId: String(proposal.id),
                        type: "proposal_expiry",
                    });

                    console.log(`📨 Sent expiry notification to ${recipient.email}`);
                }
            }
        }

        console.log("✅ Expiry notifications and emails sent successfully.");
    } catch (error) {
        console.error("❌ Error in expiry notifier cron:", error.message);
    }
});
