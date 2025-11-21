const db = require("../config/database");
const { sendMail } = require("./../utils/mailer");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

// ✅ Create new signature entry when block is dropped
exports.createSignature = async (req, res) => {
  try {
    const { blockId, parentId } = req.body;
    console.log(" i am from signature blockId:", blockId, parentId);

    if (!blockId) {
      return res.status(400).json({ error: "blockId is required" });
    }

    const newSignature = await db.models.Signature.create({
      blockId,
      parentId,
    });
    res.json({ success: true, data: newSignature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
 
// ✅ Get all signatures 
exports.getSignatures = async (req, res) => {
  try {
    const signatures = await db.models.Signature.findAll();
    res.json({ success: true, data: signatures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSignatureStatus = async (req, res) => {
  try {
    const {
      method,
      signature,
      comment,
      user_id,
      parent_id,
      recipient_email,
      recipient_name,
      recipient_id,
    } = req.body;
    const { id: blockId } = req.params; // blockId passed in URL

    console.log("i am from signature controller :", req.body);

    // 1️⃣ Find signature record by blockId
    const signatureRecord = await db.models.Signature.findOne({
      where: { blockId },
    });

    console.log("signatureRecord:", signatureRecord);

    if (!signatureRecord) {
      return res.status(404).json({ error: "Signature record not found" });
    }

    // 2️⃣ Prevent double signing / decline
    if (
      signatureRecord.status === true &&
      signatureRecord.method !== "decline"
    ) {
      return res
        .status(400)
        .json({ error: "Already signed, cannot update again." });
    }
    if (signatureRecord.method === "decline") {
      return res
        .status(400)
        .json({ error: "Already declined, cannot update again." });
    }

    // 3️⃣ Validation
    if (method === "draw" && !signature) {
      return res.status(400).json({ error: "Signature image is required." });
    }
    if (method === "type" && !signature?.trim()) {
      return res.status(400).json({ error: "Typed name is required." });
    }
    if (method === "decline" && !comment?.trim()) {
      return res.status(400).json({ error: "Decline reason is required." });
    }

    // 4️⃣ Update signature record
    await signatureRecord.update({
      status: method === "decline" ? false : true,
      signature: method === "decline" ? null : signature,
      comment: method === "decline" ? comment : null,
      method,
    });

    // 5️⃣ Get sender and receiver details
    const sender = await db.models.User.findByPk(user_id);
    // const receiver = await db.models.User.findByPk(recipient_id);

    if (!sender?.email) {
      console.warn("Sender email missing, skipping email notification.");
    } else {
      // 6️⃣ Prepare email
      const actionLabel = method === "decline" ? "declined" : "signed";
      const subject = `Document ${actionLabel} by ${recipient_name || recipient_email
        }`;
      const html = `
        <div style="font-family: Arial,sans-serif; line-height:1.5;">
          <h3>Hello ${sender.firstName || sender.email},</h3>
          <p><strong>${recipient_name || recipient_email
        }</strong> has <strong style="color:${method === "decline" ? "red" : "green"
        };">${actionLabel}</strong> the document.</p>
          ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ""}
          ${method === "draw" && signature
          ? `<img src="${signature}" alt="Signature" style="max-width:200px;"/>`
          : ""
        }
          <hr/>
          <small>Document ID: ${parent_id} • Updated at: ${new Date().toLocaleString()}</small>
        </div>
      `;

      // 7️⃣ Send email immediately
      await sendMail({ to: sender.email, subject, html });
    }

    // 8️⃣ Return response
    return res.json({ success: true, data: signatureRecord });
  } catch (error) {
    console.error("statusUpdated error:", error);
    return res.status(500).json({ error: "Failed to update signature" });
  }
};

exports.getSignatureByBlockId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(" i am from signatureId:", id);

    const signature = await db.models.Signature.findOne({
      where: { blockId: id },
    });
    if (!signature) return res.status(404).json({ error: "Not found" });
    res.json({ success: true, data: signature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.DeclineSignature = async (req, res) => {
  try {
    const { id: blockId } = req.params;

    const {
      method,
      signature,
      status,
      comment,
      receipent_email,   // <-- this is what frontend sends
      receipent_name     // <-- this too
    } = req.body;

    console.log("📩 Incoming DeclineSignature:", req.body);

    // Map spelling to correct variable names
    const recipient_email = receipent_email;
    const recipient_name = receipent_name;

    // 1️⃣ Find signature record
    const signatureRecord = await db.models.Signature.findOne({
      where: { blockId }
    });

    if (!signatureRecord) {
      return res.status(404).json({ error: "Signature record not found" });
    }

    // 2️⃣ Prevent double signing / decline
    if (signatureRecord.method === "signed") {
      return res.status(400).json({ error: "Already signed. Cannot update." });
    }

    if (signatureRecord.method === "decline") {
      return res.status(400).json({ error: "Already declined earlier." });
    }

    if (signatureRecord.method === "type") {
      return res.status(400).json({ error: "Already declined earlier." });
    }
    const declinedAt = new Date();

    // 3️⃣ Update signature record
    await signatureRecord.update({
      status: false,
      signature: null,
      comment,
      method,
      declinedAt
    });

    // 4️⃣ SEND MODERN EMAIL NOTIFICATION
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const emailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposal Declined</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #334155;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
        
        .email-header {
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .email-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 20px 20px;
            animation: float 6s ease-in-out infinite;
        }
        
        .decline-icon {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 36px;
            backdrop-filter: blur(10px);
        }
        
        .email-header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
        }
        
        .email-header p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .email-body {
            padding: 50px 40px;
        }
        
        .greeting {
            font-size: 18px;
            margin-bottom: 30px;
            color: #475569;
        }
        
        .greeting strong {
            color: #1e293b;
            font-weight: 600;
        }
        
        .status-card {
            background: linear-gradient(135deg, #fef2f2, #fecaca);
            border: 1px solid #fecaca;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
        }
        
        .status-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
            background: linear-gradient(135deg, #dc2626, #ef4444);
        }
        
        .status-title {
            font-size: 20px;
            font-weight: 700;
            color: #dc2626;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-grid {
            display: grid;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #fecaca;
        }
        
        .info-label {
            font-weight: 600;
            color: #7f1d1d;
            font-size: 14px;
        }
        
        .info-value {
            font-weight: 500;
            color: #1e293b;
            text-align: right;
        }
        
        .comment-section {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
        }
        
        .comment-label {
            font-weight: 600;
            color: #9a3412;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .comment-text {
            color: #7c2d12;
            font-style: italic;
            line-height: 1.6;
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f97316;
        }
        
        .next-steps {
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 1px solid #bae6fd;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
        }
        
        .next-steps h3 {
            color: #0369a1;
            margin-bottom: 20px;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .steps-list {
            list-style: none;
        }
        
        .steps-list li {
            padding: 12px 0;
            padding-left: 35px;
            position: relative;
            color: #0c4a6e;
        }
        
        .steps-list li::before {
            content: '→';
            position: absolute;
            left: 15px;
            color: #0284c7;
            font-weight: bold;
        }
        
        .steps-list li:not(:last-child) {
            border-bottom: 1px solid #bae6fd;
        }
        
        .contact-info {
            text-align: center;
            margin: 30px 0;
            padding: 25px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        
        .contact-info p {
            color: #64748b;
            margin-bottom: 8px;
        }
        
        .email-footer {
            text-align: center;
            padding: 30px;
            background: #f8fafc;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        
        .company-logo {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 15px;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        
        .social-link {
            color: #64748b;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .social-link:hover {
            color: #334155;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(180deg); }
        }
        
        @media (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            
            .email-body {
                padding: 30px 20px;
            }
            
            .email-header {
                padding: 30px 20px;
            }
            
            .email-header h1 {
                font-size: 24px;
            }
            
            .info-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
            
            .info-value {
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="decline-icon">❌</div>
            <h1>Proposal Declined</h1>
        </div>
        
        <div class="email-body">
            <div class="greeting">
                <p>Hello <strong>${recipient_name}</strong>,</p>
            </div>
            
            <p>We wanted to personally inform you that the following proposal has been declined By You. Below are the details:</p>
            
            <div class="status-card">
                <div class="status-title">
                    <span>📋 Decline Details</span>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">STATUS</span>
                        <span class="info-value" style="color: #dc2626; font-weight: 600;"> DECLINED</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">DECLINED AT</span> 
                        <span class="info-value"> ${declinedAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</span>
                    </div>
                </div>
            </div>
            
            ${comment ? `
            <div class="comment-section">
                <div class="comment-label">
                    <span>💬 REASON FOR DECLINE</span>
                </div>
                <div class="comment-text">
                    "${comment}"
                </div>
            </div>
            ` : `
            <div class="comment-section">
                <div class="comment-label">
                    <span>💬 REASON FOR DECLINE</span>
                </div>
                <div class="comment-text">
                    No specific reason provided.
                </div>
            </div>
            `}
            
            <div class="next-steps">
                <h3>🔄 Recommended Next Steps</h3>
                <ul class="steps-list">
                    <li>Review the decline reason carefully</li>
                    <li>Contact us for clarification if needed</li>
                    <li>Consider revising your proposal</li>
                    <li>Resubmit with necessary changes</li>
                </ul>
            </div>
            
            <div class="contact-info">
                <p>💼 Need to discuss this further?</p>
                <p>We're here to help you understand this decision and explore alternatives.</p>
            </div>
            
            <p style="text-align: center; margin-top: 30px; color: #475569;">
                <strong>Thank you for your understanding and cooperation.</strong>
            </p>
        </div>
        
        <div class="email-footer">
            <div class="company-logo">SignLink</div>
            <p>Secure Digital Signatures Made Simple</p>
            <div class="social-links">
                <a href="#" class="social-link">Website</a>
                <a href="#" class="social-link">Support</a>
                <a href="#" class="social-link">Contact</a>
            </div>
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} SignLink. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"SignLink Support" <${process.env.EMAIL_USER}>`,
      to: recipient_email,
      subject: "Proposal Declined - ",
      html: emailHTML
    });

    console.log("📩  decline email sent successfully!");

    return res.json({
      success: true,
      message: "Signature declined and  email notification sent."
    });

  } catch (err) {
    console.error("❌ DeclineSignature Error:", err);
    return res.status(500).json({ error: err.message });
  }
};


