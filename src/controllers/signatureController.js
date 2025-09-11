const db = require("../config/database");
const { sendMail } = require("./../utils/mailer");
const { v4: uuidv4 } = require("uuid");

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

    // console.log("i ma from signature controller :", req.body);

    // 1️⃣ Find signature record by blockId
    const signatureRecord = await db.models.Signature.findOne({
      where: { blockId },
    });

    // console.log("signatureRecord:", signatureRecord);

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
      const subject = `Document ${actionLabel} by ${
        recipient_name || recipient_email
      }`;
      const html = `
        <div style="font-family: Arial,sans-serif; line-height:1.5;">
          <h3>Hello ${sender.firstName || sender.email},</h3>
          <p><strong>${
            recipient_name || recipient_email
          }</strong> has <strong style="color:${
        method === "decline" ? "red" : "green"
      };">${actionLabel}</strong> the document.</p>
          ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ""}
          ${
            method === "draw" && signature
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
