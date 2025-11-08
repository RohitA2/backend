// Create schedule
const db = require("../config/database");
const nodemailer = require("nodemailer");
const { createNotification } = require("../utils/notify");
const { Op } = require("sequelize");
exports.createSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: "Schedules array is required" });
    }

    const validSchedules = schedules.filter(
      (s) => s.date && s.time && s.userId
    );
    if (validSchedules.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one schedule with date, time, and userId is required" });
    }

    const transaction = await db.sequelize.transaction();
    try {
      const createdSchedules = await db.models.Schedule.bulkCreate(
        validSchedules.map((s) => ({
          date: s.date,
          time: s.time,
          comment: s.comment || null, // Allow null if no comment provided
          userId: s.userId,
          blockId: s.blockId,
          parentId: s.parentId,
        })),
        { transaction }
      );

      await transaction.commit();

      const scheduleIds = createdSchedules.map((s) => s.id);
      res.status(201).json({
        message: "Schedules saved successfully",
        success: true,
        id: scheduleIds, // Return array of IDs
        data: createdSchedules,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Error creating schedules:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await db.models.Schedule.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single schedule by ID
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await db.models.Schedule.findByPk(id);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//get by blockId
exports.getScheduleByBlockId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔎 Request received for blockId:", id);
    const schedule = await db.models.Schedule.findAll({
      where: { blockId: id },
    });
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });
    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const deleted = await db.models.Schedule.destroy({
      where: { id: req.params.id },
    });
    if (!deleted) return res.status(404).json({ error: "Schedule not found" });
    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSchedule = async (req, res) => {
  const { scheduleId, date, time, comment, description, location } = req.body;
  console.log("📩 Incoming update request:", req.body);

  try {
    // Validate required fields
    if (!scheduleId || !date || !time) {
      return res.status(400).json({
        success: false,
        error: "Schedule ID, date, and time are required.",
      });
    }

    // Validate date and time formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: "Invalid date format. Use YYYY-MM-DD." });
    }
    if (!/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ success: false, error: "Invalid time format. Use HH:mm:ss." });
    }

    // Find the schedule
    const schedule = await db.models.Schedule.findByPk(scheduleId);
    if (!schedule) return res.status(404).json({ success: false, error: "Schedule not found." });

    const parentId = schedule.parentId;
    if (!parentId) return res.status(400).json({ success: false, error: "Parent ID not found for this schedule." });

    // Update the schedule
    await schedule.update({ date, time, comment: comment || null, description: description || null, location: location || null });
    console.log(`✅ Schedule #${scheduleId} updated successfully.`);

    // Immediate API response
    res.json({
      success: true,
      message: "Schedule updated successfully. Notifications and emails are being processed in the background.",
      schedule,
    });

    // 🔹 Background tasks: Emails + Notifications
    (async () => {
      try {
        const proposalEmail = await db.models.ProposalEmail.findOne({ where: { parentId } });
        if (!proposalEmail) {
          console.log("⚠️ No proposal email found for parentId:", parentId);
          return;
        }

        const recipients = await db.models.ProposalEmailRecipient.findAll({ where: { proposalEmailId: proposalEmail.id } });
        if (!recipients.length) {
          console.log("⚠️ No recipients found for this proposal.");
          return;
        }

        console.log(`📨 Sending notifications and emails to ${recipients.length} recipients in background...`);

        // Nodemailer setup
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        // Email template
        const emailTemplate = (recipient) => `
          <div style="font-family: Arial,sans-serif; padding: 20px; background: #f4f6f8;">
            <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.1);padding:25px;">
              <h2 style="color:#2c3e50;text-align:center;">📅 Schedule Update Notification</h2>
              <p>Dear <b>${recipient.recipientName || "Recipient"}</b>,</p>
              <p>The schedule for the proposal <b>${proposalEmail.proposalName}</b> has been updated:</p>
              <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Date:</b></td><td>${date}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Time:</b></td><td>${time}</td></tr>
                ${location ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Location:</b></td><td>${location}</td></tr>` : ""}
                ${comment ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;"><b>Comment:</b></td><td>${comment}</td></tr>` : ""}
                ${description ? `<tr><td style="padding:8px;"><b>Description:</b></td><td>${description}</td></tr>` : ""}
              </table>
              <p style="text-align:center;margin:20px 0;">
                <a href="${proposalEmail.link}" target="_blank" style="background:#007bff;color:white;padding:10px 18px;border-radius:5px;text-decoration:none;">View Proposal</a>
              </p>
              <p style="font-size:13px;color:#888;text-align:center;">Best regards,<br><b>${proposalEmail.fromName}</b></p>
            </div>
          </div>
        `;

        for (const recipient of recipients) {
          // Send email
          try {
            await transporter.sendMail({
              from: `"${proposalEmail.fromName}" <${proposalEmail.fromEmail}>`,
              to: recipient.recipientEmail,
              subject: `🗓️ Schedule Updated: ${proposalEmail.proposalName}`,
              html: emailTemplate(recipient),
            });
            console.log(`📧 Email sent to ${recipient.recipientEmail}`);
          } catch (err) {
            console.error(`❌ Failed to send email to ${recipient.recipientEmail}:`, err.message);
          }

          // Create in-app notification
          try {
            await createNotification({
              title: "Schedule Updated",
              message: `The schedule for proposal "${proposalEmail.proposalName}" has been updated.`,
              type: "info",
              userId: recipient.recipientId,
            });
            console.log(`🔔 Notification created for user ${recipient.recipientId}`);
          } catch (err) {
            console.error(`❌ Failed to create notification for user ${recipient.recipientId}:`, err.message);
          }
        }

        console.log("✅ Background emails and notifications task completed.");
      } catch (err) {
        console.error("💥 Error in background task:", err);
      }
    })();

  } catch (error) {
    console.error("💥 Error updating schedule:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error. Please try again later.",
    });
  }
};

exports.scheduleByUserId = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    console.log("🔎 Request received for userId:", id);

    // Step 1: Get all schedules for this user
    const schedules = await db.models.Schedule.findAll({
      where: { userId: id },
      transaction: t,
    });
    // console.log("📅 Schedules found:", schedules);
    console.log("📅 Schedules found:", schedules.length);

    if (!schedules || schedules.length === 0) {
      await t.rollback();
      return res.status(404).json({ message: "No schedules found for this user" });
    }

    // Step 2: Extract parentIds from schedules
    const parentIds = schedules.map((s) => s.parentId).filter(Boolean);
    console.log("📌 Extracted parentIds:", parentIds);

    if (parentIds.length === 0) {
      await t.commit();
      return res.json({
        success: true,
        message: "No parentIds found in schedules",
        data: [],
      });
    }

    // Step 3: Get all signatures with method sign or decline
    const validSignatures = await db.models.Signature.findAll({
      where: {
        parentId: parentIds,
        method: ["type", "decline"],
      },
      transaction: t,
    });

    console.log("✍️ Signatures found (sign/decline):", validSignatures.length);

    if (!validSignatures || validSignatures.length === 0) {
      await t.commit();
      return res.json({
        success: true,
        message: "No valid signatures found with method sign or decline",
        data: [],
      });
    }

    // Extract parentIds from valid signatures
    const validParentIds = [...new Set(validSignatures.map((sig) => sig.parentId))];
    console.log("✅ Valid parentIds from signatures:", validParentIds);

    if (validParentIds.length === 0) {
      await t.commit();
      return res.json({
        success: true,
        message: "No valid parentIds found from signatures",
        data: [],
      });
    }

    // Step 4: Fetch proposals for valid parentIds
    const proposalEmails = await db.models.ProposalEmail.findAll({
      where: { parentId: validParentIds },
      include: [
        {
          model: db.models.ProposalEmailRecipient,
          as: "recipients",
          include: [
            {
              model: db.models.Recipient,
              as: "recipientDetails",
            },
          ],
        },
        {
          model: db.models.User,
          as: "user",
        },

      ],
      transaction: t,
    });

    console.log("📨 ProposalEmails found:", proposalEmails.length);

    await t.commit();

    if (!proposalEmails || proposalEmails.length === 0) {
      return res.json({
        success: true,
        message: "No proposals found for valid parentIds",
        data: [],
      });
    }

    // Step 5: Combine schedules with matching proposals
    const combined = schedules
      .filter((schedule) => validParentIds.includes(schedule.parentId))
      .map((schedule) => {
        const proposal = proposalEmails.find(
          (p) => p.parentId === schedule.parentId
        );
        return {
          ...schedule.toJSON(),
          proposalEmail: proposal ? proposal.toJSON() : null,
        };
      });

    console.log("📦 Final combined records:", combined.length);

    return res.json({
      success: true,
      message: "Filtered schedules with sign/decline signatures",
      data: combined,
    });
  } catch (error) {
    console.error("❌ Error in scheduleByUserId:", error);
    await t.rollback();
    return res.status(500).json({ error: error.message });
  }
};

// exports.scheduleByUserId = async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log("🔎 Request received for userId:", id);

//     // 1️⃣ Fetch all schedules for user
//     const schedules = await db.models.Schedule.findAll({
//       where: { userId: id },
//     });

//     console.log("📅 Total Schedules found:", schedules.length);
//     if (!schedules.length) {
//       return res.status(404).json({ message: "No schedules found for this user" });
//     }

//     // 2️⃣ Extract all parentIds
//     const parentIds = schedules.map(s => s.parentId).filter(Boolean);
//     if (!parentIds.length) {
//       return res.json({
//         success: true,
//         message: "No parentIds found in schedules",
//         data: [],
//       });
//     }

//     console.log("📌 Extracted parentIds:", parentIds);

//     // 3️⃣ Get valid signatures (sign or decline)
//     const validSignatures = await db.models.Signature.findAll({
//       where: {
//         parentId: { [Op.in]: parentIds },
//         method: { [Op.in]: ["type", "decline"] },
//       },
//     });

//     console.log("✍️ Signatures found:", validSignatures.length);
//     if (!validSignatures.length) {
//       return res.json({
//         success: true,
//         message: "No valid signatures found with method sign or decline",
//         data: [],
//       });
//     }

//     // 4️⃣ Get parentIds from valid signatures
//     const validParentIds = [...new Set(validSignatures.map(sig => sig.parentId))];
//     console.log("✅ Valid parentIds:", validParentIds);

//     // 5️⃣ Fetch all proposals for those parentIds
//     const proposalEmails = await db.models.ProposalEmail.findAll({
//       where: { parentId: { [Op.in]: validParentIds } },
//       include: [
//         {
//           model: db.models.ProposalEmailRecipient,
//           as: "recipients",
//           include: [{ model: db.models.Recipient, as: "recipientDetails" }],
//         },
//         {
//           model: db.models.User,
//           as: "user",
//           attributes: ["id", "firstName", "lastName", "email"],
//         },
//       ],
//     });

//     console.log("📨 ProposalEmails found:", proposalEmails.length);
//     if (!proposalEmails.length) {
//       return res.json({
//         success: true,
//         message: "No proposals found for valid parentIds",
//         data: [],
//       });
//     }

//     // 6️⃣ Collect **all schedules** that belong to those valid parentIds
//     const allParentSchedules = await db.models.Schedule.findAll({
//       where: {
//         parentId: { [Op.in]: validParentIds },
//       },
//     });

//     console.log("🗂️ All schedules for valid parentIds:", allParentSchedules.length);

//     // 7️⃣ Combine all data
//     const combined = validParentIds.map(pid => {
//       const proposal = proposalEmails.find(p => p.parentId === pid);
//       const parentSchedules = allParentSchedules
//         .filter(s => s.parentId === pid)
//         .map(s => s.toJSON());

//       return {
//         parentId: pid,
//         proposalEmail: proposal ? proposal.toJSON() : null,
//         schedules: parentSchedules,
//       };
//     });

//     console.log("📦 Final combined records:", combined.length);

//     return res.json({
//       success: true,
//       message: "Filtered schedules (sign/decline) + all related schedules per parentId",
//       data: combined,
//     });
//   } catch (error) {
//     console.error("❌ Error in scheduleByUserId:", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

exports.getProposalsByUserId = async (req, res) => {
  try {
    const { id } = req.params;

    const userWithProposals = await db.models.User.findOne({
      where: { id },
      include: [
        {
          model: db.models.ProposalEmail,
          as: "proposalEmails",
          include: [
            {
              model: db.models.ProposalEmailRecipient,
              as: "recipients",
              include: [
                {
                  model: db.models.Recipient,
                  as: "recipientDetails",
                  attributes: ["id", "name", "phone"],
                },
              ],
            },
            {
              model: db.models.Schedule,
              as: "schedules",
              required: false,
              separate: true, // ensures proper sorting inside include
              order: [["createdAt", "DESC"]],
            },
            {
              model: db.models.Signature,
              as: "signatures",
              separate: true,
              order: [["createdAt", "DESC"]],
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
        {
          model: db.models.Schedule,
          as: "schedules",
          required: false,
          separate: true,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!userWithProposals) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Group proposals by parentId
    const grouped = {};
    userWithProposals.proposalEmails.forEach((proposal) => {
      const parentId = proposal.parentId || proposal.id;

      if (!grouped[parentId]) {
        grouped[parentId] = {
          parentId,
          proposals: [],
          recipients: [],
          schedules: [],
          signatures: [],
        };
      }

      grouped[parentId].proposals.push({
        id: proposal.id,
        proposalName: proposal.proposalName,
        fromName: proposal.fromName,
        fromEmail: proposal.fromEmail,
        expirationDate: proposal.expirationDate,
        link: proposal.link,
        createdAt: proposal.createdAt,
      });

      if (proposal.recipients)
        grouped[parentId].recipients.push(
          ...proposal.recipients.map((r) => ({
            ...r.toJSON(),
            recipientDetails: r.recipientDetails || null,
          }))
        );

      if (proposal.schedules)
        grouped[parentId].schedules.push(...proposal.schedules);

      if (proposal.signatures)
        grouped[parentId].signatures.push(...proposal.signatures);
    });

    // ✅ Sort proposals by createdAt DESC before sending
    const sortedGroupedProposals = Object.values(grouped).map((grp) => ({
      ...grp,
      proposals: grp.proposals.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
      schedules: grp.schedules.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
      signatures: grp.signatures.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    }));

    // ✅ Sort parent groups themselves by most recent proposal
    sortedGroupedProposals.sort((a, b) => {
      const aDate = a.proposals[0]?.createdAt || 0;
      const bDate = b.proposals[0]?.createdAt || 0;
      return new Date(bDate) - new Date(aDate);
    });

    res.json({
      success: true,
      user: {
        id: userWithProposals.id,
        firstName: userWithProposals.firstName,
        lastName: userWithProposals.lastName,
        email: userWithProposals.email,
        companyName: userWithProposals.companyName,
      },
      groupedProposals: sortedGroupedProposals,
      userSchedules:
        (userWithProposals.schedules || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ),
    });
  } catch (error) {
    console.error("❌ Error fetching proposals:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


exports.fcmToken = async (req, res) => {
  try {
    const { token, userId } = req.body; // match frontend names
    // console.log("📲 Received FCM Token for User:", token, "for user:", userId);

    // Find the user
    const user = await db.models.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Save the token
    user.fcmToken = token;
    await user.save();

    res.json({ message: "✅ FCM token updated successfully" });
  } catch (error) {
    console.error("❌ Error updating FCM token:", error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.fcmTokenForRecipent = async (req, res) => {
  try {
    const { token, id } = req.body; // match frontend names
    console.log("📲 Received FCM Token for recipent:", token, "for recipent Id:", id);

    // Find the user
    const user = await db.models.Recipient.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Recipent not found" });
    }

    // Save the token
    user.fcmToken = token;
    await user.save();

    res.json({ message: "✅ FCM token updated successfully for Recipent" });
  } catch (error) {
    console.error("❌ Error updating FCM token for Recipent:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.expiringProposals = async (req, res) => {
  // 🕒 Define range: start of today → end of tomorrow (local timezone)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date();
  endOfTomorrow.setDate(startOfToday.getDate() + 1);
  endOfTomorrow.setHours(23, 59, 59, 999);

  console.log("📅 Checking proposals between:", startOfToday, "and", endOfTomorrow);
  try {
    // 📨 Fetch proposals that expire between today and tomorrow
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

    // Optional detailed logging
    if (expiringProposals.length > 0) {
      console.log(
        "📋 Expiring proposals data:",
        expiringProposals.map((p) => p.toJSON())
      );
    }

    // 🧾 Send response
    res.status(200).json({
      message: "✅ Expiring proposals fetched successfully",
      count: expiringProposals.length,
      data: expiringProposals,
    });
  } catch (error) {
    console.error("❌ Error fetching expiring proposals:", error);
    res.status(500).json({
      message: "Server error while fetching expiring proposals",
      error: error.message,
    });
  }
};






