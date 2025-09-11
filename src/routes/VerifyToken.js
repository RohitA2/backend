// routes/proposal.js
const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.get("/view-by-token", async (req, res) => {
  try {
    const { token } = req.query;
    // console.log("token:", token);

    if (!token)
      return res.status(400).json({ success: false, error: "Missing token" });

    const recipientRow = await db.models.ProposalEmailRecipient.findOne({
      where: { token },
      include: [{ model: db.models.ProposalEmail, as: "proposal" }],
    });

    if (!recipientRow)
      return res
        .status(404)
        .json({ success: false, error: "Invalid or expired token" });

    // // optional expiry check
    // if (
    //   recipientRow.tokenExpires &&
    //   new Date(recipientRow.tokenExpires) < new Date()
    // ) {
    //   return res.status(410).json({ success: false, error: "Token expired" });
    // }

    // const proposalEmail = recipientRow.proposalEmail;
    // // Derive parentId: either stored in proposalEmail.parentId OR parse it from proposalEmail.link
    // let parentId = proposalEmail.parentId || null;
    // if (!parentId && proposalEmail.link) {
    //   try {
    //     const url = new URL(proposalEmail.link);
    //     parentId = url.searchParams.get("parentId");
    //   } catch (e) {
    //     parentId = null;
    //   }
    // }

    return res.json({
      success: true,
      data: {
        recipientRowId: recipientRow.id,
        recipientId: recipientRow.recipientId,
        recipientName: recipientRow.recipientName,
        recipientEmail: recipientRow.recipientEmail,
        token: recipientRow.token,
      },
    });
  } catch (err) {
    console.error("view-by-token error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
