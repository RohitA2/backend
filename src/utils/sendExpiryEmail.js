// utils/sendExpiryEmail.js
const nodemailer = require("nodemailer");

/**
 * Send expiry reminder email with link
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.name - Recipient name
 * @param {string} params.proposalName - Proposal title
 * @param {Date} params.expirationDate - Expiry date
 * @param {string} params.link - Proposal link
 * @param {string} params.senderName - Sender name
 * @param {string} params.senderEmail - Sender email
 */
async function sendExpiryEmail({ to, name, proposalName, expirationDate, link, senderName, senderEmail   }) {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const formattedDate = new Date(expirationDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

                     const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposal Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center;">
                <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <span style="font-size: 36px; color: #007bff;">⏰</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Action Required</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Friendly Reminder</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <!-- Greeting -->
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #2c3e50; margin: 0 0 10px; font-size: 22px; font-weight: 600;">Hi ${name},</h2>
                    <p style="color: #666; margin: 0; line-height: 1.6; font-size: 16px;">
                        This is a gentle reminder about the pending proposal <strong style="color: #2c3e50;">${proposalName}</strong> from <strong style="color: #2c3e50;">${senderName}</strong> that requires your attention.
                    </p>
                </div>

                <!-- Proposal Card -->
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #007bff;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="background: #007bff; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="color: white; font-size: 18px;">📄</span>
                        </div>
                        <div>
                            <h3 style="color: #2c3e50; margin: 0; font-size: 18px; font-weight: 600;">${proposalName}</h3>
                            <p style="color: #666; margin: 5px 0 0; font-size: 14px;">Proposal from ${senderName}</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                        <div style="text-align: center;">
                            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <span style="font-size: 20px;">📅</span>
                                <p style="color: #666; margin: 8px 0 0; font-size: 12px; font-weight: 600;">EXPIRES</p>
                                <p style="color: #e74c3c; margin: 5px 0 0; font-size: 14px; font-weight: 700;">${expirationDate || "Soon"}</p>
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <span style="font-size: 20px;">👤</span>
                                <p style="color: #666; margin: 8px 0 0; font-size: 12px; font-weight: 600;">SENDER</p>
                                <p style="color: #2c3e50; margin: 5px 0 0; font-size: 14px; font-weight: 700;">${senderName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${link}" target="_blank"
                       style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 8px 20px rgba(40, 167, 69, 0.3); transition: all 0.3s ease;">
                       Review Proposal Now
                    </a>
                    <p style="color: #666; margin: 15px 0 0; font-size: 14px;">
                        Click above to review and take action on this proposal
                    </p>
                </div>

                <!-- Additional Info -->
                <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 25px 0;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span style="font-size: 18px; color: #6c757d; margin-right: 10px;">💡</span>
                        <p style="color: #495057; margin: 0; font-size: 14px; font-weight: 600;">Quick Action Required</p>
                    </div>
                    <p style="color: #6c757d; margin: 0; font-size: 14px; line-height: 1.5;">
                        Please review this proposal at your earliest convenience to ensure timely processing. Your prompt attention is greatly appreciated.
                    </p>
                </div>

                <!-- Note -->
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px; margin: 0; font-style: italic;">
                        This is an automated reminder. Please disregard if you've already taken action on this proposal.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                <div style="margin-bottom: 15px;">
                    <span style="color: #6c757d; font-size: 12px;">Sent by ${senderName} • ${senderEmail}</span>
                </div>
                <div style="border-top: 1px solid #dee2e6; padding-top: 15px;">
                    <p style="color: #999; margin: 0; font-size: 11px;">
                        © ${new Date().getFullYear()} SignLink. All rights reserved.<br>
                        This email was sent automatically. Please do not reply to this message.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

        await transporter.sendMail({
            from: `"Proposal System" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Reminder: ${proposalName} is expiring soon`,
            html,
        });

        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error("❌ Failed to send email to", to, ":", error.message);
    }
}

module.exports = sendExpiryEmail;
