const nodemailer = require("nodemailer");
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

exports.sendProposalEmail = async (req, res) => {
  try {
    const { headerId, userId, name, from, to, expirationDate, link, parentId } =
      req.body;

    console.log(
      "headerId, userId, name, from, to, expirationDate, link",
      headerId,
      userId,
      name,
      from,
      to,
      expirationDate,
      link,
      parentId
    );

    if (!userId || !name || !from || !to || !link || !parentId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ error: "Missing recipient emails" });
    }

    if (!from?.email) {
      return res.status(400).json({ error: "Missing sender email" });
    }

    // 1. Create parent ProposalEmail record
    const proposalEmail = await db.models.ProposalEmail.create({
      headerId,
      parentId: parentId,
      userId,
      proposalName: name,
      fromName: from.fullName,
      fromEmail: from.email,
      expirationDate: expirationDate || null,
      link,
      status: "sent", // default, will be updated if failures
    });

    // 2. Nodemailer transporter
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

    // 3. Send email one by one (each recipient unique token & DB row)
    for (const recipient of to) {
      const token = uuidv4();
      const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Append token to link (keep parentId etc. intact)
      const recipientLink = `${link}${
        link.includes("?") ? "&" : "?"
      }token=${token}`;

      const mailOptions = {
        from: `"${from.fullName}" <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        replyTo: from.email,
        subject: `Proposal: ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif; line-height:1.5;">
            <h2>Hi ${recipient.name || ""},</h2>
            <p>You’ve received a new proposal from <strong>${
              from.fullName
            }</strong>.</p>
            <p><strong>Proposal Name:</strong> ${name}</p>
            <p><strong>Expires On:</strong> ${expirationDate || "N/A"}</p>
            <p>
              <a href="${recipientLink}" target="_blank" 
                 style="display:inline-block; margin-top:10px; padding:10px 15px; 
                        background:#007bff; color:#fff; text-decoration:none; border-radius:5px;">
                View Proposal
              </a>
            </p>
            <hr />
            <p style="font-size:12px; color:#555;">
              Proposal ID: ${headerId} <br/>
              Sent by ${from.fullName} (${from.email})
            </p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);

        // Save recipient record with token
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
        console.error("Failed to send email to", recipient.email, err);

        // Save recipient record as failed
        await db.models.ProposalEmailRecipient.create({
          proposalEmailId: proposalEmail.id,
          recipientId: recipient.id,
          recipientName: recipient.name || "",
          recipientEmail: recipient.email,
          sentAt: new Date(),
          errorMessage: err.message,
          status: "failed",
          token,
          tokenExpiresAt: tokenExpires,
        });

        results.push({ email: recipient.email, status: "failed" });

        // Mark parent as partially failed
        await proposalEmail.update({ status: "failed" });
      }
    }

    res.json({
      success: true,
      message: "Emails processed",
      results,
    });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send proposal email" });
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
    if (!sender?.email) return;

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

    console.log(`✅ Notification email sent to sender: ${sender.email}`);
  } catch (err) {
    console.error("❌ Failed to send response email:", err);
  }
};

exports.updateExpirationDate = async (req, res) => {
  try {
    const { proposalEmailId, newExpirationDate } = req.body;

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
      const recipientLink = `${baseLink}${
        baseLink.includes("?") ? "&" : "?"
      }token=${recipient.token}`;

      const mailOptions = {
        from: `"${proposalEmail.fromName}" <${process.env.EMAIL_USER}>`,
        to: recipient.recipientEmail,
        subject: `Updated Expiration: ${proposalEmail.proposalName}`,
        html: `
          <div style="font-family:Arial,sans-serif; line-height:1.5;">
            <h2>Hi ${recipient.recipientName || ""},</h2>
            <p>The expiration date for the proposal <strong>${
              proposalEmail.proposalName
            }</strong> 
               from <strong>${
                 proposalEmail.fromName
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
