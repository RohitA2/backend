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
