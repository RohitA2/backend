const nodemailer = require("nodemailer");
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { createNotification } = require("../utils/notify"); // Adjust path as needed


// exports.sendProposalEmail = async (req, res) => {
//   try {
//     const { headerId, userId, name, from, to, expirationDate, link, parentId } = req.body;

//     console.log("📩 Sending proposal email:", { headerId, userId, name, from, to, expirationDate, link, parentId });

//     // ✅ Basic validation
//     if (!userId || !name || !from || !to || !link || !parentId)
//       return res.status(400).json({ error: "Missing required fields" });

//     if (!Array.isArray(to) || to.length === 0)
//       return res.status(400).json({ error: "Missing recipient emails" });

//     if (!from?.email)
//       return res.status(400).json({ error: "Missing sender email" });

//     // ✅ 1. Get all schedules under the same parentId
//     const schedules = await db.models.Schedule.findAll({
//       where: { parentId },
//       order: [["date", "ASC"], ["time", "ASC"]],
//     });

//     const scheduleTable =
//       schedules.length > 0
//         ? `
//         <h3 style="margin-top:20px;">📅 Schedule Details</h3>
//         <table style="width:100%;border-collapse:collapse;margin-top:10px;">
//           <thead>
//             <tr style="background:#007bff;color:#fff;">
//               <th style="padding:8px;text-align:left;">Date</th>
//               <th style="padding:8px;text-align:left;">Time</th>
//               <th style="padding:8px;text-align:left;">Comment</th>
//               <th style="padding:8px;text-align:left;">Location</th>
//               <th style="padding:8px;text-align:left;">Description</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${schedules
//           .map(
//             (s) => `
//               <tr style="border-bottom:1px solid #eee;">
//                 <td style="padding:8px;">${s.date}</td>
//                 <td style="padding:8px;">${s.time}</td>
//                 <td style="padding:8px;">${s.comment || "-"}</td>
//                 <td style="padding:8px;">${s.location || "-"}</td>
//                 <td style="padding:8px;">${s.description || "-"}</td>
//               </tr>
//             `
//           )
//           .join("")}
//           </tbody>
//         </table>
//       `
//         : "<p>No schedules found for this proposal.</p>";

//     // ✅ 2. Create parent ProposalEmail record
//     const proposalEmail = await db.models.ProposalEmail.create({
//       headerId,
//       parentId,
//       userId,
//       proposalName: name,
//       fromName: from.fullName,
//       fromEmail: from.email,
//       expirationDate: expirationDate || null,
//       link,
//       status: "processing", // initially "processing"
//     });

//     // ✅ 3. Setup transporter
//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 465,
//       secure: true,
//       auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
//     });

//     // ✅ 4. Respond immediately (non-blocking)
//     res.json({
//       success: true,
//       message: "Proposal email(s) are being sent in background.",
//       schedules: schedules.length,
//       recipients: to.length,
//     });

//     // ✅ 5. Background process starts (non-blocking)
//     (async () => {
//       try {
//         let results = [];

//         await Promise.allSettled(
//           to.map(async (recipient) => {
//             const token = uuidv4();
//             const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
//             const recipientLink = `${link}${link.includes("?") ? "&" : "?"}token=${token}`;

//             const htmlBody = `
//               <div style="font-family:Arial,sans-serif;line-height:1.5;background:#f8f9fa;padding:20px;">
//                 <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1);padding:25px;">
//                   <h2 style="color:#2c3e50;">📨 New Proposal Received</h2>
//                   <p>Hi ${recipient.name || "there"},</p>
//                   <p>You’ve received a new proposal from <strong>${from.fullName}</strong>.</p>

//                   <p><strong>Proposal Name:</strong> ${name}</p>
//                   <p><strong>Expires On:</strong> ${expirationDate || "N/A"}</p>

//                   ${scheduleTable}

//                   <div style="text-align:center;margin:25px 0;">
//                     <a href="${recipientLink}" target="_blank"
//                       style="background:#007bff;color:white;padding:10px 18px;border-radius:5px;text-decoration:none;">
//                       View Proposal
//                     </a>
//                   </div>

//                   <hr/>
//                   <p style="font-size:12px;color:#555;text-align:center;">
//                     Proposal ID: ${parentId} <br/>
//                     Sent by ${from.fullName} (${from.email})
//                   </p>
//                 </div>
//               </div>
//             `;

//             try {
//               await transporter.sendMail({
//                 from: `"${from.fullName}" <${process.env.EMAIL_USER}>`,
//                 to: recipient.email,
//                 replyTo: from.email,
//                 subject: `Proposal: ${name}`,
//                 html: htmlBody,
//               });

//               await db.models.ProposalEmailRecipient.create({
//                 proposalEmailId: proposalEmail.id,
//                 recipientId: recipient.id,
//                 recipientName: recipient.name || "",
//                 recipientEmail: recipient.email,
//                 sentAt: new Date(),
//                 status: "sent",
//                 token,
//                 tokenExpires,
//               });

//               results.push({ email: recipient.email, status: "sent" });
//             } catch (err) {
//               console.error("❌ Failed to send email to", recipient.email, err.message);
//               await db.models.ProposalEmailRecipient.create({
//                 proposalEmailId: proposalEmail.id,
//                 recipientId: recipient.id,
//                 recipientName: recipient.name || "",
//                 recipientEmail: recipient.email,
//                 sentAt: new Date(),
//                 status: "failed",
//                 errorMessage: err.message,
//                 token,
//                 tokenExpires,
//               });
//               results.push({ email: recipient.email, status: "failed" });
//             }
//           })
//         );

//         // ✅ Update status & send notification
//         const sentCount = results.filter((r) => r.status === "sent").length;
//         const failedCount = results.filter((r) => r.status === "failed").length;
//         const msg = `Proposal "${name}" sent to ${sentCount} recipient(s). ${failedCount > 0 ? `${failedCount} failed.` : ""}`;

//         await proposalEmail.update({ status: failedCount > 0 ? "failed" : "sent" });

//         await createNotification({
//           title: "Proposal Sent",
//           message: msg,
//           type: failedCount > 0 ? "warning" : "success",
//           userId,
//         });

//         console.log("✅ Background email sending completed:", msg);
//       } catch (err) {
//         console.error("💥 Background process failed:", err);
//         await proposalEmail.update({ status: "failed" });
//         await createNotification({
//           title: "Proposal Sending Failed",
//           message: `Proposal "${name}" failed due to server error.`,
//           type: "error",
//           userId,
//         });
//       }
//     })(); // End background async IIFE

//   } catch (err) {
//     console.error("💥 Email sending error:", err);
//     res.status(500).json({ error: "Failed to process proposal email request" });
//   }
// };


exports.sendProposalEmail = async (req, res) => {
  try {
    const { headerId, userId, name, from, to, expirationDate, link, parentId, is_template, template_data, template_name } = req.body;

    console.log("📩 Sending proposal email:", { headerId, userId, name, from, to, expirationDate, link, parentId, is_template, template_data, template_name });

    // ✅ Basic validation
    if (!userId || !name || !from || !to || !link || !parentId)
      return res.status(400).json({ error: "Missing required fields" });

    if (!Array.isArray(to) || to.length === 0)
      return res.status(400).json({ error: "Missing recipient emails" });

    if (!from?.email)
      return res.status(400).json({ error: "Missing sender email" });

    // ✅ 1. Get all schedules under the same parentId
    const schedules = await db.models.Schedule.findAll({
      where: { parentId },
      order: [["date", "ASC"], ["time", "ASC"]],
    });

    // ✅ Enhanced Schedule Table
    const scheduleTable =
      schedules.length > 0
        ? `
        <div style="margin: 30px 0;">
          <div style="background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); color: white; padding: 15px 20px; border-radius: 10px 10px 0 0;">
            <h3 style="margin: 0; font-size: 18px; display: flex; align-items: center;">
              <span style="margin-right: 10px;">📅</span> Meeting Schedule
            </h3>
          </div>
          <div style="overflow-x: auto;">
            <table style="width:100%; border-collapse: collapse; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Date</th>
                  <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Time</th>
                  <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Comment</th>
                  <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Location</th>
                  <th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6;">Description</th>
                </tr>
              </thead>
              <tbody>
                ${schedules
          .map(
            (s, index) => `
                  <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : 'background: white;'}">
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #495057; font-weight: 500;">${s.date}</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #495057;">${s.time}</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #6c757d;">${s.comment || "-"}</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #495057;">${s.location || "-"}</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; color: #6c757d;">${s.description || "-"}</td>
                  </tr>
                `
          )
          .join("")}
              </tbody>
            </table>
          </div>
          <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0; text-align: center;">
            ${schedules.length} scheduled meeting${schedules.length > 1 ? 's' : ''}
          </p>
        </div>
      `
        : `<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; color: #6c757d;">📅</span>
            <p style="color: #6c757d; margin: 10px 0 0;">No scheduled meetings for this proposal.</p>
          </div>`;

    // ✅ 2. Create parent ProposalEmail record
    const proposalEmail = await db.models.ProposalEmail.create({
      headerId,
      parentId,
      userId,
      proposalName: name,
      fromName: from.fullName,
      fromEmail: from.email,
      expirationDate: expirationDate || null,
      link,
      status: "processing", // initially "processing"
      isTemplate: is_template,
      templateData: template_data,
      templateName: template_name
    });

    console.log("i am from after creation :", proposalEmail);

    // ✅ 3. Setup transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // ✅ 4. Respond immediately (non-blocking)
    res.json({
      success: true,
      message: "Proposal email(s) are being sent in background.",
      schedules: schedules.length,
      recipients: to.length,
    });

    // ✅ 5. Background process starts (non-blocking)
    (async () => {
      try {
        let results = [];

        await Promise.allSettled(
          to.map(async (recipient) => {
            const token = uuidv4();
            const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const recipientLink = `${link}${link.includes("?") ? "&" : "?"}token=${token}`;

            // ✅ Enhanced HTML Email Template
            const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Proposal</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center;">
                <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <span style="font-size: 36px; color: #007bff;">📨</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">New Proposal</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Ready for Your Review</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <!-- Greeting -->
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #2c3e50; margin: 0 0 10px; font-size: 22px; font-weight: 600;">Hi ${recipient.name || "there"},</h2>
                    <p style="color: #666; margin: 0; line-height: 1.6; font-size: 16px;">
                        You've received a new proposal from <strong style="color: #007bff;">${from.fullName}</strong> for your consideration.
                    </p>
                </div>

                <!-- Proposal Details Card -->
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #007bff;">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <div style="background: #007bff; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="color: white; font-size: 20px;">📄</span>
                        </div>
                        <div>
                            <h3 style="color: #2c3e50; margin: 0; font-size: 20px; font-weight: 600;">${name}</h3>
                            <p style="color: #666; margin: 5px 0 0; font-size: 14px;">Proposal from ${from.fullName}</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                        <div style="text-align: center;">
                            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <span style="font-size: 20px;">⏰</span>
                                <p style="color: #666; margin: 8px 0 0; font-size: 12px; font-weight: 600;">EXPIRES</p>
                                <p style="color: ${expirationDate ? '#e74c3c' : '#6c757d'}; margin: 5px 0 0; font-size: 14px; font-weight: 700;">
                                    ${expirationDate || "No expiry"}
                                </p>
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <span style="font-size: 20px;">👤</span>
                                <p style="color: #666; margin: 8px 0 0; font-size: 12px; font-weight: 600;">FROM</p>
                                <p style="color: #2c3e50; margin: 5px 0 0; font-size: 14px; font-weight: 700;">${from.fullName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Schedule Section -->
                ${scheduleTable}

                <!-- Action Button -->
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${recipientLink}" target="_blank"
                       style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 8px 20px rgba(40, 167, 69, 0.3); transition: all 0.3s ease;">
                       Review Proposal
                    </a>
                    <p style="color: #666; margin: 15px 0 0; font-size: 14px;">
                        Click above to view the complete proposal details and take action
                    </p>
                </div>

                <!-- Important Note -->
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
                    <div style="display: flex; align-items: flex-start;">
                        <span style="font-size: 16px; color: #856404; margin-right: 10px;">💡</span>
                        <div>
                            <p style="color: #856404; margin: 0 0 5px; font-size: 14px; font-weight: 600;">Important</p>
                            <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.4;">
                                Please review this proposal before the expiration date. Your timely response is appreciated.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                <div style="margin-bottom: 15px;">
                    <span style="color: #6c757d; font-size: 12px; display: block; margin-bottom: 5px;">Proposal ID: ${parentId}</span>
                    <span style="color: #6c757d; font-size: 12px;">Sent by ${from.fullName} • ${from.email}</span>
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

            try {
              await transporter.sendMail({
                from: `"${from.fullName}" <${process.env.EMAIL_USER}>`,
                to: recipient.email,
                replyTo: from.email,
                subject: `Proposal: ${name}`,
                html: htmlBody,
              });

              await db.models.ProposalEmailRecipient.create({
                proposalEmailId: proposalEmail.id,
                recipientId: recipient.id,
                recipientName: recipient.name || "",
                recipientEmail: recipient.email,
                sentAt: new Date(),
                status: "sent",
                token,
                tokenExpires,
              });

              results.push({ email: recipient.email, status: "sent" });
            } catch (err) {
              console.error("❌ Failed to send email to", recipient.email, err.message);
              await db.models.ProposalEmailRecipient.create({
                proposalEmailId: proposalEmail.id,
                recipientId: recipient.id,
                recipientName: recipient.name || "",
                recipientEmail: recipient.email,
                sentAt: new Date(),
                status: "failed",
                errorMessage: err.message,
                token,
                tokenExpires,
              });
              results.push({ email: recipient.email, status: "failed" });
            }
          })
        );

        // ✅ Update status & send notification
        const sentCount = results.filter((r) => r.status === "sent").length;
        const failedCount = results.filter((r) => r.status === "failed").length;
        const msg = `Proposal "${name}" sent to ${sentCount} recipient(s). ${failedCount > 0 ? `${failedCount} failed.` : ""}`;

        await proposalEmail.update({ status: failedCount > 0 ? "failed" : "sent" });

        await createNotification({
          title: "Proposal Sent",
          message: msg,
          type: failedCount > 0 ? "warning" : "success",
          userId,
        });

        console.log("✅ Background email sending completed:", msg);
      } catch (err) {
        console.error("💥 Background process failed:", err);
        await proposalEmail.update({ status: "failed" });
        await createNotification({
          title: "Proposal Sending Failed",
          message: `Proposal "${name}" failed due to server error.`,
          type: "error",
          userId,
        });
      }
    })(); // End background async IIFE

  } catch (err) {
    console.error("💥 Email sending error:", err);
    res.status(500).json({ error: "Failed to process proposal email request" });
  }
};

exports.sendSignatureResponseEmail = async ({
  proposalEmailId,
  sender,
  receiver,
  action,
  comment,
}) => {
  try {
    if (!sender?.email || !sender?.userId) return;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const subject =
      action === "decline"
        ? `Proposal Declined by ${receiver.name}`
        : `Proposal Signed by ${receiver.name}`;

    // const html = `
    //   <div style="font-family:Arial,sans-serif; line-height:1.5;">
    //     <h2>Hello ${sender.fullName},</h2>
    //     <p>Your recipient <strong>${receiver.name}</strong> has 
    //       <span style="color:${action === "decline" ? "red" : "green"};">
    //         ${action === "decline" ? "declined" : "signed"}
    //       </span> the proposal.</p>
    //     ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ""}
    //     <hr />
    //     <p style="font-size:12px; color:#555;">
    //       Proposal ID: ${proposalEmailId}
    //     </p>
    //   </div>
    // `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposal Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header with Dynamic Color -->
            <div style="background: linear-gradient(135deg, ${action === "decline" ? '#e74c3c 0%, #c0392b 100%' : '#28a745 0%, #20c997 100%'}); padding: 30px; text-align: center;">
                <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <span style="font-size: 36px; color: ${action === "decline" ? '#e74c3c' : '#28a745'};">
                        ${action === "decline" ? '❌' : '✅'}
                    </span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                    ${action === "decline" ? 'Proposal Declined' : 'Proposal Signed!'}
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
                    ${action === "decline" ? 'Action Required' : 'Congratulations!'}
                </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <!-- Greeting -->
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #2c3e50; margin: 0 0 10px; font-size: 22px; font-weight: 600;">Hello ${sender.fullName},</h2>
                    <p style="color: #666; margin: 0; line-height: 1.6; font-size: 16px;">
                        We have an important update regarding your proposal.
                    </p>
                </div>

                <!-- Status Card -->
                <div style="background: ${action === "decline" ? '#fdf2f2' : '#f0f9f4'}; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid ${action === "decline" ? '#e74c3c' : '#28a745'};">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <div style="background: ${action === "decline" ? '#e74c3c' : '#28a745'}; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="color: white; font-size: 20px;">
                                ${action === "decline" ? '👎' : '👍'}
                            </span>
                        </div>
                        <div>
                            <h3 style="color: #2c3e50; margin: 0; font-size: 20px; font-weight: 600;">
                                ${action === "decline" ? 'Proposal Declined' : 'Proposal Successfully Signed!'}
                            </h3>
                            <p style="color: #666; margin: 5px 0 0; font-size: 14px;">
                                by <strong>${receiver.name}</strong>
                            </p>
                        </div>
                    </div>

                    <!-- Status Badge -->
                    <div style="display: inline-block; background: ${action === "decline" ? '#e74c3c' : '#28a745'}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 20px;">
                        ${action === "decline" ? 'DECLINED' : 'SIGNED'}
                    </div>

                    ${comment ? `
                    <!-- Comment Section -->
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border: 1px solid ${action === "decline" ? '#fadbd8' : '#d1f2eb'};">
                        <div style="display: flex; align-items: flex-start;">
                            <span style="font-size: 16px; color: #666; margin-right: 10px;">💬</span>
                            <div>
                                <p style="color: #666; margin: 0 0 8px; font-size: 14px; font-weight: 600;">Recipient's Comment:</p>
                                <p style="color: #2c3e50; margin: 0; font-size: 15px; line-height: 1.5; font-style: italic; background: #f8f9fa; padding: 12px; border-radius: 6px;">
                                    "${comment}"
                                </p>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Next Steps -->
                    <div style="background: ${action === "decline" ? '#fff3cd' : '#e3f2fd'}; border-radius: 8px; padding: 15px; margin: 15px 0;">
                        <div style="display: flex; align-items: flex-start;">
                            <span style="font-size: 16px; color: ${action === "decline" ? '#856404' : '#1565c0'}; margin-right: 10px;">
                                ${action === "decline" ? '📝' : '🎉'}
                            </span>
                            <div>
                                <p style="color: ${action === "decline" ? '#856404' : '#1565c0'}; margin: 0 0 5px; font-size: 14px; font-weight: 600;">
                                    ${action === "decline" ? 'Next Steps' : 'Great News!'}
                                </p>
                                <p style="color: ${action === "decline" ? '#856404' : '#1565c0'}; margin: 0; font-size: 13px; line-height: 1.4;">
                                    ${action === "decline"
        ? 'Consider reaching out to discuss their concerns or modify the proposal accordingly.'
        : 'The proposal has been officially accepted. You can proceed with the next steps in your workflow.'
      }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Summary Card -->
                <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #2c3e50; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Quick Summary</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p style="color: #666; margin: 0 0 5px; font-size: 12px; font-weight: 600;">RECIPIENT</p>
                            <p style="color: #2c3e50; margin: 0; font-size: 14px; font-weight: 600;">${receiver.name}</p>
                        </div>
                        <div>
                            <p style="color: #666; margin: 0 0 5px; font-size: 12px; font-weight: 600;">STATUS</p>
                            <p style="color: ${action === "decline" ? '#e74c3c' : '#28a745'}; margin: 0; font-size: 14px; font-weight: 700;">
                                ${action === "decline" ? 'Declined' : 'Signed'}
                            </p>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <p style="color: #666; margin: 0 0 5px; font-size: 12px; font-weight: 600;">PROPOSAL ID</p>
                        <p style="color: #2c3e50; margin: 0; font-size: 14px; font-weight: 600; font-family: monospace;">${proposalEmailId}</p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL || '#'}/dashboard" 
                       style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%); color: white; padding: 12px 30px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px; box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);">
                       View Dashboard
                    </a>
                    ${action === "decline" ? `
                    <a href="${process.env.APP_URL || '#'}/proposals/${proposalEmailId}" 
                       style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 12px 30px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 10px; box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);">
                       Edit Proposal
                    </a>
                    ` : ''}
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                <div style="margin-bottom: 15px;">
                    <span style="color: #6c757d; font-size: 12px; display: block; margin-bottom: 5px;">Action completed on ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
                </div>
                <div style="border-top: 1px solid #dee2e6; padding-top: 15px;">
                    <p style="color: #999; margin: 0; font-size: 11px;">
                        © ${new Date().getFullYear()} SignLink. All rights reserved.<br>
                        This is an automated notification. Please do not reply to this email.
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
      to: sender.email,
      subject,
      html,
    });

    // Create notification for the sender
    const notifMessage = `${receiver.name} has ${action === "decline" ? "declined" : "signed"} the proposal.${comment ? ` Comment: ${comment}` : ''}`;
    await createNotification({
      title: action === "decline" ? "Proposal Declined" : "Proposal Signed",
      message: notifMessage,
      type: action === "decline" ? "warning" : "success",
      userId: sender.userId,
    });

    console.log(`✅ Notification email sent to sender: ${sender.email}`);
  } catch (err) {
    console.error("❌ Failed to send response email:", err);
  }
};

exports.updateExpirationDate = async (req, res) => {
  try {
    const { proposalEmailId, newExpirationDate } = req.body;
    console.log(proposalEmailId, newExpirationDate);

    if (!proposalEmailId || !newExpirationDate) {
      return res.status(400).json({
        error: "Missing required fields: proposalEmailId and newExpirationDate",
      });
    }

    // Validate date format (assuming ISO string or valid date)
    const expirationDate = new Date(newExpirationDate);
    if (isNaN(expirationDate.getTime())) {
      return res.status(400).json({ error: "Invalid expiration date format" });
    }

    // 1. Update the parent ProposalEmail record
    const proposalEmail = await db.models.ProposalEmail.findByPk(
      proposalEmailId
    );

    if (!proposalEmail) {
      return res.status(404).json({ error: "Proposal email not found" });
    }

    console.log(
      `Expiration date updated for proposalEmailId: ${proposalEmailId}`
    );

    await proposalEmail.update({ expirationDate: expirationDate });

    // Create notification for the user who created the proposal
    await createNotification({
      title: "Expiration Date Updated",
      message: `Expiration date for "${proposalEmail.proposalName}" updated to ${expirationDate.toLocaleDateString()}`,
      type: "info",
      userId: proposalEmail.userId,
    });

    // 2. Get all recipients for this proposal
    const recipients = await db.models.ProposalEmailRecipient.findAll({
      where: { proposalEmailId },
    });

    // console.log(
    //   `Found ${recipients.length} recipients for proposalEmailId: ${proposalEmailId}`
    // );

    if (recipients.length === 0) {
      return res.json({
        success: true,
        message:
          "Expiration date updated successfully (no recipients to notify)",
      });
    }

    // 3. Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let results = [];

    // 4. Send update email to each recipient
    for (const recipient of recipients) {
      if (recipient.status !== "sent" && recipient.status !== "opened")
        continue; // Skip if not relevant

      // Reconstruct the recipient link with token
      const baseLink = proposalEmail.link;
      const recipientLink = `${baseLink}${baseLink.includes("?") ? "&" : "?"
        }token=${recipient.token}`;

      const mailOptions = {
        from: `"${proposalEmail.fromName}" <${process.env.EMAIL_USER}>`,
        to: recipient.recipientEmail,
        subject: `Updated Expiration: ${proposalEmail.proposalName}`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposal Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 30px; text-align: center;">
                <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <span style="font-size: 36px; color: #17a2b8;">🔄</span>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Update Notification</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Expiration Date Modified</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <!-- Greeting -->
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #2c3e50; margin: 0 0 10px; font-size: 22px; font-weight: 600;">Hi ${recipient.recipientName || "there"},</h2>
                    <p style="color: #666; margin: 0; line-height: 1.6; font-size: 16px;">
                        We're writing to inform you about an important update to your proposal.
                    </p>
                </div>

                <!-- Update Card -->
                <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #2196f3;">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <div style="background: #2196f3; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <span style="color: white; font-size: 18px;">📅</span>
                        </div>
                        <div>
                            <h3 style="color: #2c3e50; margin: 0; font-size: 18px; font-weight: 600;">Expiration Date Updated</h3>
                            <p style="color: #666; margin: 5px 0 0; font-size: 14px;">Important timeline change</p>
                        </div>
                    </div>
                    
                    <!-- Proposal Details -->
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <p style="color: #666; margin: 0 0 5px; font-size: 12px; font-weight: 600;">PROPOSAL</p>
                                <p style="color: #2c3e50; margin: 0; font-size: 16px; font-weight: 700;">${proposalEmail.proposalName}</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="color: #666; margin: 0 0 5px; font-size: 12px; font-weight: 600;">FROM</p>
                                <p style="color: #2c3e50; margin: 0; font-size: 14px; font-weight: 600;">${proposalEmail.fromName}</p>
                            </div>
                        </div>
                        
                        <!-- Date Update Highlight -->
                        <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 8px; padding: 15px; margin: 15px 0; border: 1px solid #ffd43b;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <p style="color: #856404; margin: 0 0 5px; font-size: 12px; font-weight: 600;">NEW EXPIRATION DATE</p>
                                    <p style="color: #e74c3c; margin: 0; font-size: 18px; font-weight: 800;">
                                        ${expirationDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
                                    </p>
                                </div>
                                <div style="background: #e74c3c; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <span style="color: white; font-size: 18px;">⚠️</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p style="color: #666; margin: 15px 0 0; font-size: 14px; line-height: 1.5;">
                        Please take note of this updated timeline and plan your review accordingly.
                    </p>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${recipientLink}" target="_blank"
                       style="display: inline-block; background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3); transition: all 0.3s ease;">
                       Review Updated Proposal
                    </a>
                    <p style="color: #666; margin: 15px 0 0; font-size: 14px;">
                        Click above to access the latest version of the proposal
                    </p>
                </div>

                <!-- Important Note -->
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
                    <div style="display: flex; align-items: flex-start;">
                        <span style="font-size: 16px; color: #856404; margin-right: 10px;">💡</span>
                        <div>
                            <p style="color: #856404; margin: 0 0 5px; font-size: 14px; font-weight: 600;">Please Note</p>
                            <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.4;">
                                This update may affect your review timeline. We recommend reviewing the proposal with the new expiration date in mind.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                <div style="margin-bottom: 15px;">
                    <span style="color: #6c757d; font-size: 12px; display: block; margin-bottom: 5px;">Proposal ID: ${proposalEmail.id}</span>
                    <span style="color: #6c757d; font-size: 12px;">Updated by ${proposalEmail.fromName} • ${proposalEmail.fromEmail}</span>
                </div>
                <div style="border-top: 1px solid #dee2e6; padding-top: 15px;">
                    <p style="color: #999; margin: 0; font-size: 11px;">
                        © ${new Date().getFullYear()} SignLink. All rights reserved.<br>
                        This update was processed on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`,
      };

      try {
        await transporter.sendMail(mailOptions);

        // Optionally update last notified or something, but for now just log
        results.push({ email: recipient.recipientEmail, status: "notified" });
      } catch (err) {
        console.error(
          "Failed to send update email to",
          recipient.recipientEmail,
          err
        );
        results.push({ email: recipient.recipientEmail, status: "failed" });
      }
    }

    res.json({
      success: true,
      message: "Expiration date updated and notifications sent",
      updatedDate: expirationDate.toISOString(),
      results,
    });
  } catch (err) {
    console.error("Update expiration error:", err);
    res.status(500).json({ error: "Failed to update expiration date" });
  }
};


exports.sendReminder = async (req, res) => {
  try {
    const {
      proposalId,
      proposalName,
      expiryTime,
      clientNames,
      clientEmails,
    } = req.body;

    console.log("🔔 Sending reminder:", { proposalId, proposalName, clientNames, clientEmails });

    // ✅ Basic validation
    if (!proposalId || !proposalName || !clientEmails) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: proposalId, proposalName, clientEmails"
      });
    }

    // ✅ Find the proposal email record
    const proposalEmail = await db.models.ProposalEmail.findOne({
      where: { id: proposalId },
      include: [{
        model: db.models.ProposalEmailRecipient,
        as: 'recipients'
      }]
    });

    if (!proposalEmail) {
      return res.status(404).json({
        success: false,
        error: "Proposal not found"
      });
    }

    // ✅ Get sender info
    const sender = {
      fullName: proposalEmail.fromName,
      email: proposalEmail.fromEmail,
      userId: proposalEmail.userId
    };

    // ✅ Create individual recipient objects with their specific names
    const emailArray = clientEmails.split(',').map(email => email.trim());
    const nameArray = clientNames.split(',').map(name => name.trim());

    const recipients = emailArray.map((email, index) => ({
      email: email,
      name: nameArray[index] || "there" // Fallback if name not available
    }));

    // ✅ Respond immediately (non-blocking)
    res.json({
      success: true,
      message: "Reminder emails are being sent in background",
      recipients: recipients.length,
      proposalName,
      clientNames
    });

    // ✅ Background process starts (non-blocking)
    (async () => {
      try {
        let results = [];
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
        });

        await Promise.allSettled(
          recipients.map(async (recipient) => {
            try {
              // Find recipient record to get token
              const recipientRecord = proposalEmail.recipients?.find(
                r => r.recipientEmail === recipient.email
              );

              const recipientLink = recipientRecord
                ? `${proposalEmail.link}${proposalEmail.link.includes("?") ? "&" : "?"}token=${recipientRecord.token}`
                : proposalEmail.link;

              const htmlBody = `
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
                    <h2 style="color: #2c3e50; margin: 0 0 10px; font-size: 22px; font-weight: 600;">Hi ${recipient.name},</h2>
                    <p style="color: #666; margin: 0; line-height: 1.6; font-size: 16px;">
                        This is a gentle reminder about the pending proposal <strong style="color: #2c3e50;">${proposalName}</strong> from <strong style="color: #2c3e50;">${sender.fullName}</strong> that requires your attention.
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
                            <p style="color: #666; margin: 5px 0 0; font-size: 14px;">Proposal from ${sender.fullName}</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                        <div style="text-align: center;">
                            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <span style="font-size: 20px;">📅</span>
                                <p style="color: #666; margin: 8px 0 0; font-size: 12px; font-weight: 600;">EXPIRES</p>
                                <p style="color: #e74c3c; margin: 5px 0 0; font-size: 14px; font-weight: 700;">${expiryTime || "Soon"}</p>
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                <span style="font-size: 20px;">👤</span>
                                <p style="color: #666; margin: 8px 0 0; font-size: 12px; font-weight: 600;">SENDER</p>
                                <p style="color: #2c3e50; margin: 5px 0 0; font-size: 14px; font-weight: 700;">${sender.fullName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${recipientLink}" target="_blank"
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
                    <span style="color: #6c757d; font-size: 12px; display: block; margin-bottom: 5px;">Proposal ID: ${proposalId}</span>
                    <span style="color: #6c757d; font-size: 12px;">Sent by ${sender.fullName} • ${sender.email}</span>
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
                from: `"${sender.fullName}" <${process.env.EMAIL_USER}>`,
                to: recipient.email,
                replyTo: sender.email,
                subject: `Reminder: Action Required for ${proposalName}`,
                html: htmlBody,
              });

              results.push({ email: recipient.email, status: "sent" });
              console.log(`✅ Reminder sent to: ${recipient.email}`);

            } catch (err) {
              console.error("❌ Failed to send reminder to", recipient.email, err.message);
              results.push({ email: recipient.email, status: "failed", error: err.message });
            }
          })
        );

        // ✅ Create notification for sender
        const sentCount = results.filter((r) => r.status === "sent").length;
        const failedCount = results.filter((r) => r.status === "failed").length;

        const message = `Reminder for "${proposalName}" sent to ${sentCount} recipient(s). ${failedCount > 0 ? `${failedCount} failed.` : ""}`;

        await createNotification({
          title: `Reminder message successfully sent for Proposal ${proposalName}`,
          message: message,
          type: failedCount > 0 ? "warning" : "success",
          userId: sender.userId,
        });

        console.log("✅ Reminder process completed:", message);

      } catch (err) {
        console.error("💥 Background reminder process failed:", err);
        await createNotification({
          title: "Reminder Failed",
          message: `Failed to send reminder for "${proposalName}"`,
          type: "error",
          userId: proposalEmail.userId,
        });
      }
    })(); // End background async IIFE

  } catch (err) {
    console.error("💥 Reminder controller error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to process reminder request"
    });
  }
};



