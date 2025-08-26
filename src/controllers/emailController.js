const nodemailer = require("nodemailer");
exports.sendProposalEmail = async (req, res) => {
  try {
    const {
      headerId,
      userId,
      name,
      from,
      to,
      expirationDate,
      link, // document/proposal link
    } = req.body;

    if (!to?.email || !from?.email) {
      return res.status(400).json({ error: "Missing sender or recipient email" });
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${from.fullName}" <${process.env.EMAIL_USER}>`,
      to: to.email,
      subject: `Proposal: ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif; line-height:1.5;">
          <h2>Hi ${to.name},</h2>
          <p>You’ve received a new proposal from <strong>${from.fullName}</strong>.</p>

          <p><strong>Proposal Name:</strong> ${name}</p>
          <p><strong>Expires On:</strong> ${expirationDate || "N/A"}</p>

          <p>
            You can view the proposal here:  
            <a href="${link}" target="_blank" 
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

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Proposal email sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send proposal email" });
  }
};