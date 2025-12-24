// controllers/adminController.js (or wherever your allUser is located)
const db = require("../config/database");
const { sendMail } = require("../utils/mailer")
const sendNotification = require("../utils/sendNotification");

// exports.allUser = (req, res) => {
//     db.models.User.findAll()
//         .then((users) => {
//             res.json(users);
//         })
//         .catch((error) => {
//             console.error("Error fetching users:", error);
//             res.status(500).json({ message: "Failed to fetch users" });
//         });
// };


// In your controller (e.g., controllers/adminController.js or wherever allUser is defined):
exports.allUser = (req, res) => {
    db.models.User.findAll({
        include: [{
            model: db.models.Recipient,
            as: 'recipients', // Alias from your association
            required: false // Include users even without recipients
        }],
        order: [['createdAt', 'DESC']] // Optional: Sort by creation date
    })
        .then((users) => {
            // Optional: Enrich with recipient count for easy frontend access
            const enrichedUsers = users.map(user => ({
                ...user.toJSON(),
                recipientCount: user.recipients ? user.recipients.length : 0
            }));
            res.json(enrichedUsers);
        })
        .catch((error) => {
            console.error("Error fetching users:", error);
            res.status(500).json({ message: "Failed to fetch users" });
        });
};

exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const user = await db.models.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate status
        const validStatuses = ["Active", "Inactive"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        user.status = status;
        await user.save();

        res.json({ message: "Status updated successfully", user });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Failed to update status" });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        const user = await db.models.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate role
        const validRoles = ["Admin", "Moderator", "User"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        user.role = role;
        await user.save();

        res.json({ message: "Role updated successfully", user });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Failed to update role" });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const user = await db.models.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Optional: Validate fields based on model
        // For example, validate status and role if provided
        if (updateData.status) {
            const validStatuses = ["Active", "Inactive", "Pending"];
            if (!validStatuses.includes(updateData.status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
        }
        if (updateData.role) {
            const validRoles = ["Admin", "Moderator", "User"];
            if (!validRoles.includes(updateData.role)) {
                return res.status(400).json({ message: "Invalid role" });
            }
        }

        await user.update(updateData);

        res.json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await db.models.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};


exports.allProposals = (req, res) => {
    db.models.ProposalEmail.findAll({
        order: [['createdAt', 'DESC']],
    })
        .then((proposals) => {
            res.json(proposals);
        })
        .catch((error) => {
            console.error("Error fetching proposals:", error);
            res.status(500).json({ message: "Failed to fetch proposals" });
        });
};

exports.updateProposal = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const proposal = await db.models.ProposalEmail.findByPk(id);
        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        // Validate status if provided
        if (updateData.status) {
            const validStatuses = ["Active", "Expired", "Viewed"];
            if (!validStatuses.includes(updateData.status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
        }

        await proposal.update(updateData);

        res.json({ message: "Proposal updated successfully", proposal });
    } catch (error) {
        console.error("Error updating proposal:", error);
        res.status(500).json({ message: "Failed to update proposal" });
    }
};

exports.deleteProposal = async (req, res) => {
    const { id } = req.params;

    try {
        const proposal = await db.models.ProposalEmail.findByPk(id);
        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        await proposal.destroy();

        res.json({ message: "Proposal deleted successfully" });
    } catch (error) {
        console.error("Error deleting proposal:", error);
        res.status(500).json({ message: "Failed to delete proposal" });
    }
};




exports.getUnVerifiedCompany = async (req, res) => {
    try {
        const companies = await db.models.CompanyDetails.findAll({
            where: {
                is_verified: false,
            },
            include: [
                {
                    model: db.models.User,
                    attributes: [
                        "id",
                        "firstName",
                        "lastName",
                        "email",
                        "mobile_number",
                        "role",
                        "fcmToken",
                        "createdAt",
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        if (!companies.length) {
            return res.status(200).json({
                success: true,
                message: "No unverified companies found",
                data: [],
            });
        }

        return res.status(200).json({
            success: true,
            message: "Unverified companies fetched successfully",
            data: companies,
        });
    } catch (error) {
        console.error("Error fetching unverified companies:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch unverified companies",
        });
    }
};

exports.verifyCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { is_verified = true } = req.body;

        if (!is_verified) {
            return res.status(400).json({ success: false, message: "Use reject endpoint for rejection" });
        }

        const company = await db.models.CompanyDetails.findByPk(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        await company.update({
            is_verified: true,
            is_verified_at: new Date(),
            reason: null,
        });

        await db.models.User.update(
            { companyVerified: true },
            { where: { id: company.userId } }
        );

        // Fetch user (with fcmToken)
        const user = await db.models.User.findByPk(company.userId);

        // Send Email (existing)
        if (user?.email) {
            try {
                await sendMail({
                    to: user.email,
                    subject: "Company Verification Approved! 🎉",
                    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: white;
            padding: 40px 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .status-card {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .company-name {
            color: #065f46;
            font-weight: 700;
            font-size: 20px;
        }
        .features-list {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .features-list ul {
            margin: 0;
            padding-left: 20px;
        }
        .features-list li {
            margin-bottom: 10px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(16, 185, 129, 0.3);
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: celebrate 2s ease-in-out;
        }
        .confetti {
            font-size: 24px;
            margin: 0 2px;
        }
        h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        h2 {
            color: #065f46;
            margin-top: 0;
            font-size: 24px;
        }
        h3 {
            color: #047857;
            margin-bottom: 15px;
        }
        p {
            margin-bottom: 16px;
        }
        @keyframes celebrate {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">✅</div>
            <div style="margin-bottom: 10px;">
                <span class="confetti">🎉</span>
                <span class="confetti">✨</span>
                <span class="confetti">🥳</span>
            </div>
            <h1>Verification Approved!</h1>
        </div>
        
        <div class="content">
            <h2>Congratulations, ${user.firstName}! 🎊</h2>
            
            <p>We're excited to inform you that your company verification has been successfully completed. Welcome to our community of verified businesses!</p>
            
            <div class="status-card">
                <p><strong>Verified Company:</strong><br>
                <span class="company-name">${company.companyName}</span></p>
                <p><strong>Verification Status:</strong> <span style="color: #10b981; font-weight: 700;">✓ Approved</span></p>
                <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
            </div>
            
            <h3>🎯 What's Next?</h3>
            <div class="features-list">
                <p><strong>You now have full access to:</strong></p>
                <ul>
                    <li>Complete business dashboard</li>
                    <li>Premium features and tools</li>
                    <li>Enhanced trust and credibility badge</li>
                    <li>Priority customer support</li>
                    <li>All subscription plans and upgrades</li>
                    <li>Marketplace visibility (if applicable)</li>
                </ul>
            </div>
            
            <p style="font-size: 16px; color: #065f46; font-weight: 600;">
                Ready to explore your new capabilities?
            </p>
            
            <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'https://signlink.se'}" class="cta-button">
                    Go to Your Dashboard →
                </a>
            </div>
            
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
                <em>Your account is now fully activated. No further action is required.</em>
            </p>
            
            <div class="footer">
                <p>Questions? Visit our <a href="${process.env.APP_URL || 'https://signlink.se'}" style="color: #059669; text-decoration: none; font-weight: 500;">Help Center</a> or contact support.</p>
                <p>Welcome aboard!<br><strong>SignLink Team</strong></p>
                <p style="font-size: 12px; color: #a0aec0; margin-top: 20px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
                });
            } catch (emailErr) {
                console.error("Failed to send approval email:", emailErr);
            }
        }

        // Send FCM Push Notification to Client (new)
        if (user?.fcmToken) {
            try {
                await sendNotification(
                    user.fcmToken,
                    "Verification Approved ✅",
                    `Congratulations! Your company "${company.companyName}" has been successfully verified. You now have full access.`,
                    {
                        type: "verification_status",
                        status: "approved",
                        companyId: company.id.toString(),
                        companyName: company.companyName,
                    }
                );
            } catch (notifErr) {
                console.error("Failed to send approval push notification:", notifErr);
                // Do not fail the whole request if notification fails
            }
        }

        return res.status(200).json({
            success: true,
            message: "Company verified successfully",
            data: company,
        });
    } catch (error) {
        console.error("Error updating company verification:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update company verification",
        });
    }
};

exports.rejectCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { reason } = req.body;

        if (!reason?.trim()) {
            return res.status(400).json({ success: false, message: "Rejection reason is required" });
        }

        const company = await db.models.CompanyDetails.findByPk(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        await company.update({
            is_verified: false,
            is_verified_at: null,
            reason: reason.trim(),
        });

        await db.models.User.update(
            { companyVerified: false },
            { where: { id: company.userId } }
        );

        // Fetch user (with fcmToken)
        const user = await db.models.User.findByPk(company.userId);

        // Send Email (existing)
        if (user?.email) {
            try {
                await sendMail({
                    to: user.email,
                    subject: "Company Verification Update - Action Required",
                    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: white;
            padding: 40px 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .status-card {
            background: #fff5f5;
            border-left: 4px solid #f56565;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .company-name {
            color: #2d3748;
            font-weight: 600;
            font-size: 18px;
        }
        .reason-box {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-style: italic;
        }
        .support-link {
            display: inline-block;
            background: #4299e1;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        h2 {
            color: #2d3748;
            margin-top: 0;
        }
        p {
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">❌</div>
            <h1>Verification Status Update</h1>
        </div>
        
        <div class="content">
            <h2>Hello ${user.firstName},</h2>
            
            <p>We've reviewed your verification request and need to inform you that we're unable to verify your company at this time.</p>
            
            <div class="status-card">
                <p><strong>Company:</strong> <span class="company-name">${company.companyName}</span></p>
                <p><strong>Status:</strong> <span style="color: #e53e3e; font-weight: 600;">Rejected</span></p>
            </div>
            
            <h3>Reason for Rejection:</h3>
            <div class="reason-box">
                ${reason.trim()}
            </div>
            
            <p>You may submit a new verification request after addressing the issue mentioned above. Please ensure all information is accurate and complete when reapplying.</p>
            
            <div style="text-align: center;">
                <a href="mailto:signlinksupport@gmail.com" class="support-link">Contact Support</a>
            </div>
            
            <div class="footer">
                <p>Need help? Our support team is here for you.</p>
                <p>Best regards,<br><strong>SignLink Team</strong></p>
                <p style="font-size: 12px; color: #a0aec0; margin-top: 20px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
                });
            } catch (emailErr) {
                console.error("Failed to send rejection email:", emailErr);
            }
        }

        // Send FCM Push Notification to Client (new)
        if (user?.fcmToken) {
            try {
                await sendNotification(
                    user.fcmToken,
                    "Verification Rejected ❌",
                    `Your verification request for "${company.companyName}" was rejected.\nReason: ${reason.trim()}`,
                    {
                        type: "verification_status",
                        status: "rejected",
                        companyId: company.id.toString(),
                        companyName: company.companyName,
                        reason: reason.trim(),
                    }
                );
            } catch (notifErr) {
                console.error("Failed to send rejection push notification:", notifErr);
                // Do not fail the whole request if notification fails
            }
        }

        return res.status(200).json({
            success: true,
            message: "Company rejected successfully",
            data: company,
        });
    } catch (error) {
        console.error("Error rejecting company:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject company",
        });
    }
};