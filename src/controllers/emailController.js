const nodemailer = require("nodemailer");
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { createNotification } = require("../utils/notify"); // Adjust path as needed

exports.sendProposalEmail = async (req, res) => {
  try {
    const { headerId, userId, name, from, to, expirationDate, link, parentId } = req.body;

    console.log("📩 Sending proposal email:", { headerId, userId, name, from, to, expirationDate, link, parentId });

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

    const scheduleTable =
      schedules.length > 0
        ? `
        <h3 style="margin-top:20px;">📅 Schedule Details</h3>
        <table style="width:100%;border-collapse:collapse;margin-top:10px;">
          <thead>
            <tr style="background:#007bff;color:#fff;">
              <th style="padding:8px;text-align:left;">Date</th>
              <th style="padding:8px;text-align:left;">Time</th>
              <th style="padding:8px;text-align:left;">Comment</th>
              <th style="padding:8px;text-align:left;">Location</th>
              <th style="padding:8px;text-align:left;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${schedules
              .map(
                (s) => `
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px;">${s.date}</td>
                <td style="padding:8px;">${s.time}</td>
                <td style="padding:8px;">${s.comment || "-"}</td>
                <td style="padding:8px;">${s.location || "-"}</td>
                <td style="padding:8px;">${s.description || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
        : "<p>No schedules found for this proposal.</p>";

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
    });

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

            const htmlBody = `
              <div style="font-family:Arial,sans-serif;line-height:1.5;background:#f8f9fa;padding:20px;">
                <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.1);padding:25px;">
                  <h2 style="color:#2c3e50;">📨 New Proposal Received</h2>
                  <p>Hi ${recipient.name || "there"},</p>
                  <p>You’ve received a new proposal from <strong>${from.fullName}</strong>.</p>
                  
                  <p><strong>Proposal Name:</strong> ${name}</p>
                  <p><strong>Expires On:</strong> ${expirationDate || "N/A"}</p>
                  
                  ${scheduleTable}

                  <div style="text-align:center;margin:25px 0;">
                    <a href="${recipientLink}" target="_blank"
                      style="background:#007bff;color:white;padding:10px 18px;border-radius:5px;text-decoration:none;">
                      View Proposal
                    </a>
                  </div>

                  <hr/>
                  <p style="font-size:12px;color:#555;text-align:center;">
                    Proposal ID: ${parentId} <br/>
                    Sent by ${from.fullName} (${from.email})
                  </p>
                </div>
              </div>
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

    const html = `
      <div style="font-family:Arial,sans-serif; line-height:1.5;">
        <h2>Hello ${sender.fullName},</h2>
        <p>Your recipient <strong>${receiver.name}</strong> has 
          <span style="color:${action === "decline" ? "red" : "green"};">
            ${action === "decline" ? "declined" : "signed"}
          </span> the proposal.</p>
        ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ""}
        <hr />
        <p style="font-size:12px; color:#555;">
          Proposal ID: ${proposalEmailId}
        </p>
      </div>
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
          <div style="font-family:Arial,sans-serif; line-height:1.5;">
            <h2>Hi ${recipient.recipientName || ""},</h2>
            <p>The expiration date for the proposal <strong>${proposalEmail.proposalName
          }</strong> 
               from <strong>${proposalEmail.fromName
          }</strong> has been updated.</p>
            <p><strong>New Expiration Date:</strong> ${expirationDate.toLocaleDateString()}</p>
            <p>
              <a href="${recipientLink}" target="_blank" 
                 style="display:inline-block; margin-top:10px; padding:10px 15px; 
                        background:#007bff; color:#fff; text-decoration:none; border-radius:5px;">
                View Proposal
              </a>
            </p>
            <hr />
            <p style="font-size:12px; color:#555;">
              Updated on: ${new Date().toLocaleDateString()}
            </p>
          </div>
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