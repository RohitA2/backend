// controllers/adminController.js (or wherever your allUser is located)
const db = require("../config/database");
const { sendMail } = require("../utils/mailer")
const sendNotification = require("../utils/sendNotification");
const bcrypt = require("bcrypt");


exports.createUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            mobile_number,
            gender,
            country,
            state,
            city,
            companyName,
            role = 'User', // Default to 'User'
            status = 'Active' // Default to 'Active'
        } = req.body;

        // Validate required fields
        if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                message: "First name, last name, email, and password are required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long"
            });
        }

        // Check if email already exists
        const existingUser = await db.models.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Validate role
        const validRoles = ['Admin', 'Client', 'User'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        // Validate status
        const validStatuses = ['Active', 'Inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Must be 'Active' or 'Inactive'"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await db.models.User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            mobile_number,
            gender,
            country,
            state,
            city,
            companyName,
            role,
            status,
            is_verified: true, // Auto-verify admin-created users
            is_verified_at: new Date()
        });

        // Modern welcome email template
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const loginUrl = process.env.FRONTEND_URL || 'https://signlink.se/login'; // Update with your actual login URL

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SignLink</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background-color: #f4f7fa; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); 
        }
        .header { 
            background: linear-gradient(135deg, #6b46c1, #4c1d95); 
            color: #ffffff; 
            padding: 50px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: 600; 
        }
        .header p { 
            margin: 12px 0 0; 
            font-size: 18px; 
            opacity: 0.95; 
        }
        .content { 
            padding: 40px 30px; 
            color: #374151; 
            line-height: 1.7; 
        }
        .content h2 { 
            font-size: 24px; 
            margin-top: 0; 
            color: #1f2937; 
        }
        .credentials { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 24px; 
            margin: 28px 0; 
            font-size: 16px; 
        }
        .credentials p { 
            margin: 12px 0; 
        }
        .credentials strong { 
            color: #6b46c1; 
            font-weight: 600; 
        }
        .btn { 
            display: block; 
            width: 220px; 
            margin: 32px auto; 
            padding: 16px; 
            background: linear-gradient(135deg, #6b46c1, #4c1d95); 
            color: #ffffff; 
            text-align: center; 
            text-decoration: none; 
            font-weight: 600; 
            font-size: 18px; 
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(107, 70, 193, 0.3); 
            transition: transform 0.2s; 
        }
        .btn:hover { 
            transform: translateY(-2px); 
        }
        .footer { 
            background: #f1f5f9; 
            padding: 30px; 
            text-align: center; 
            font-size: 14px; 
            color: #64748b; 
        }
        .footer a { 
            color: #6b46c1; 
            text-decoration: none; 
        }
        @media (max-width: 640px) {
            .container { margin: 20px; }
            .header { padding: 40px 20px; }
            .content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to SignLink!</h1>
            <p>Your account has been created successfully</p>
        </div>
        <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>We're excited to have you on board. Your SignLink account is now ready to use.</p>
            
            <p>Please use the following credentials to log in:</p>
            <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Role:</strong> ${role}</p>
                ${companyName ? `<p><strong>Company:</strong> ${companyName}</p>` : ''}
            </div>
            
            <p><strong>Important:</strong> For your security, please change your password immediately after your first login.</p>
            
            <a href="${loginUrl}" class="btn">Log In to SignLink</a>
            
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            <p>Best regards,<br><strong>The SignLink Team</strong></p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} SignLink. All rights reserved.<br>
            <a href="https:signlink.se">signlink.se</a>
        </div>
    </div>
</body>
</html>
        `;

        // Send welcome email (fire and forget)
        sendMail({
            to: email,
            subject: "Welcome to SignLink – Your Account Credentials",
            html
        }).catch(mailError => {
            console.error("Failed to send welcome email:", mailError);
            // Do not fail the request if email fails
        });

        // Return success response (exclude password)
        res.status(201).json({
            message: "User created successfully. Welcome email with credentials sent.",
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                mobile_number: user.mobile_number,
                gender: user.gender,
                country: user.country,
                state: user.state,
                city: user.city,
                companyName: user.companyName,
                role: user.role,
                status: user.status,
                is_verified: user.is_verified,
                is_verified_at: user.is_verified_at,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        console.error("Error creating user:", error);

        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors.map(e => e.message)
            });
        }

        // Handle unique constraint (email)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: "A user with this email already exists"
            });
        }

        // Generic server error
        res.status(500).json({
            message: "Failed to create user. Please try again later."
        });
    }
};


exports.allUser = (req, res) => {
    db.models.User.findAll({
        where: { role: 'User' },
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



exports.allClients = async (req, res) => {
    try {
        const users = await db.models.User.findAll({
            where: { role: "Client" },
            include: [
                {
                    model: db.models.CompanyDetails,
                    required: false, // 👈 client can exist without company details
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.json(users);
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ message: "Failed to fetch clients" });
    }
};



// Get single client by ID
exports.getClient = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await db.models.User.findOne({
            where: { id, role: "Client" },
            include: [
                {
                    model: CompanyDetails,
                    required: false,
                },
            ],
        });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        res.json(client);
    } catch (error) {
        console.error("Error fetching client:", error);
        res.status(500).json({ message: "Failed to fetch client" });
    }
};

// Create new client
// exports.createClient = async (req, res) => {
//     try {
//         const {
//             firstName,
//             lastName,
//             email,
//             password,
//             mobile_number,
//             gender,
//             country,
//             state,
//             city,
//             companyName,
//             companySize,
//             companyWebsite,
//             phoneNumber,
//             taxId,
//             accountType = 'company'
//         } = req.body;

//         // Check if email already exists
//         const existingUser = await db.models.User.findOne({ where: { email } });
//         if (existingUser) {
//             return res.status(400).json({ message: "Email already registered" });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create user
//         const user = await db.models.User.create({
//             firstName,
//             lastName,
//             email,
//             password: hashedPassword,
//             mobile_number,
//             gender,
//             country,
//             state,
//             city,
//             companyName,
//             role: "Client",
//             status: "Active",
//             is_verified: true
//         });

//         // Create company details if provided
//         if (companyName || companySize || companyWebsite || phoneNumber || taxId) {
//             await db.models.CompanyDetails.create({
//                 userId: user.id,
//                 companyName: companyName || user.companyName,
//                 companySize,
//                 companyWebsite,
//                 phoneNumber,
//                 accountType,
//                 taxId,
//                 is_verified: false, // Start as pending verification
//                 reason: null
//             });
//         }

//         // Fetch created client with company details
//         const createdClient = await db.models.User.findOne({
//             where: { id: user.id },
//             include: [
//                 {
//                     model: db.models.CompanyDetails,
//                     required: false,
//                 },
//             ],
//         });

//         res.status(201).json({
//             message: "Client created successfully",
//             client: createdClient
//         });
//     } catch (error) {
//         console.error("Error creating client:", error);
//         res.status(500).json({ message: "Failed to create client" });
//     }
// };
exports.createClient = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            mobile_number,
            gender,
            country,
            state,
            city,
            companyName,
            companySize,
            companyWebsite,
            phoneNumber,
            taxId,
            accountType = 'company'
        } = req.body;

        // Check if email already exists
        const existingUser = await db.models.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await db.models.User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            mobile_number,
            gender,
            country,
            state,
            city,
            companyName,
            role: "Client",
            status: "Active",
            is_verified: true
        });

        // Create company details if provided
        if (companyName || companySize || companyWebsite || phoneNumber || taxId) {
            await db.models.CompanyDetails.create({
                userId: user.id,
                companyName: companyName || user.companyName,
                companySize,
                companyWebsite,
                phoneNumber,
                accountType,
                taxId,
                is_verified: true, // Start as pending verification
                reason: null
            });
        }

        // Modern welcome email template
        const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Valued Client';
        const loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'https://your-signlink-app.com/login'; // Change to your actual login URL

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SignLink</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background-color: #f4f7fa; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); 
        }
        .header { 
            background: linear-gradient(135deg, #3b82f6, #1e40af); 
            color: #ffffff; 
            padding: 50px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: 600; 
        }
        .header p { 
            margin: 12px 0 0; 
            font-size: 18px; 
            opacity: 0.95; 
        }
        .content { 
            padding: 40px 30px; 
            color: #374151; 
            line-height: 1.7; 
        }
        .content h2 { 
            font-size: 24px; 
            margin-top: 0; 
            color: #1f2937; 
        }
        .credentials { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 24px; 
            margin: 28px 0; 
            font-size: 16px; 
        }
        .credentials p { 
            margin: 12px 0; 
        }
        .credentials strong { 
            color: #3b82f6; 
            font-weight: 600; 
        }
        .btn { 
            display: block; 
            width: 220px; 
            margin: 32px auto; 
            padding: 16px; 
            background: linear-gradient(135deg, #3b82f6, #1e40af); 
            color: #ffffff; 
            text-align: center; 
            text-decoration: none; 
            font-weight: 600; 
            font-size: 18px; 
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); 
            transition: transform 0.2s; 
        }
        .btn:hover { 
            transform: translateY(-2px); 
        }
        .footer { 
            background: #f1f5f9; 
            padding: 30px; 
            text-align: center; 
            font-size: 14px; 
            color: #64748b; 
        }
        .footer a { 
            color: #3b82f6; 
            text-decoration: none; 
        }
        @media (max-width: 640px) {
            .container { margin: 20px; }
            .header { padding: 40px 20px; }
            .content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to SignLink!</h1>
            <p>Your account has been created successfully</p>
        </div>
        <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>We're thrilled to have you on board. Your SignLink account is now ready to use.</p>
            ${companyName ? `<p>Your company <strong>${companyName}</strong> has been successfully registered with us.</p>` : '<p>You can now access all the features available to SignLink clients.</p>'}
            
            <p>Please use the following credentials to log in:</p>
            <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
            </div>
            
            <p><strong>Important:</strong> For your security, please change your password immediately after your first login.</p>
            
            <a href="${loginUrl}" class="btn">Log In to SignLink</a>
            
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            <p>Best regards,<br><strong>The SignLink Team</strong></p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} SignLink. All rights reserved.<br>
            <a href="https://signlink.se">Learn more about SignLink</a>
        </div>
    </div>
</body>
</html>
        `;

        // Send welcome email (fire and forget - don't block response if email fails)
        sendMail({
            to: email,
            subject: "Welcome to SignLink – Your Account Credentials",
            html
        }).catch(mailError => {
            console.error("Failed to send welcome email:", mailError);
            // Do not throw - account creation should still succeed
        });

        // Fetch created client with company details
        const createdClient = await db.models.User.findOne({
            where: { id: user.id },
            include: [
                {
                    model: db.models.CompanyDetails,
                    required: false,
                },
            ],
        });

        res.status(201).json({
            message: "Client created successfully and welcome email sent",
            client: createdClient
        });
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ message: "Failed to create client" });
    }
};

// Update client
exports.updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName,
            lastName,
            email,
            mobile_number,
            gender,
            country,
            state,
            city,
            status,
            companyName,
            companyDetails
        } = req.body;

        // Find client
        const client = await db.models.User.findOne({
            where: { id, role: "Client" },
            include: [db.models.CompanyDetails]
        });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Update user fields
        const updatedUserData = {
            firstName: firstName !== undefined ? firstName : client.firstName,
            lastName: lastName !== undefined ? lastName : client.lastName,
            email: email !== undefined ? email : client.email,
            mobile_number: mobile_number !== undefined ? mobile_number : client.mobile_number,
            gender: gender !== undefined ? gender : client.gender,
            country: country !== undefined ? country : client.country,
            state: state !== undefined ? state : client.state,
            city: city !== undefined ? city : client.city,
            status: status !== undefined ? status : client.status,
            companyName: companyName !== undefined ? companyName : client.companyName
        };

        await client.update(updatedUserData);

        // Update or create company details
        if (companyDetails) {
            const { companySize, companyWebsite, phoneNumber, taxId } = companyDetails;

            if (client.CompanyDetail) {
                // Update existing company details
                await client.CompanyDetail.update({
                    companyName: companyName !== undefined ? companyName : client.CompanyDetail.companyName,
                    companySize: companySize !== undefined ? companySize : client.CompanyDetail.companySize,
                    companyWebsite: companyWebsite !== undefined ? companyWebsite : client.CompanyDetail.companyWebsite,
                    phoneNumber: phoneNumber !== undefined ? phoneNumber : client.CompanyDetail.phoneNumber,
                    taxId: taxId !== undefined ? taxId : client.CompanyDetail.taxId
                });
            } else if (companyName || companySize || companyWebsite || phoneNumber || taxId) {
                // Create new company details
                await db.models.CompanyDetails.create({
                    userId: client.id,
                    companyName: companyName || client.companyName,
                    companySize,
                    companyWebsite,
                    phoneNumber,
                    accountType: 'company',
                    taxId,
                    is_verified: false,
                    reason: null
                });
            }
        }

        // Fetch updated client with company details
        const updatedClient = await db.models.User.findOne({
            where: { id: client.id },
            include: [db.models.CompanyDetails]
        });

        res.json({
            message: "Client updated successfully",
            client: updatedClient
        });
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Failed to update client" });
    }
};

// Update client status
exports.updateClientStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log("status", status);

        const client = await db.models.User.findOne({
            where: { id, role: "Client" }
        });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        await client.update({ status });

        res.json({
            message: "Client status updated successfully",
            client: client
        });
    } catch (error) {
        console.error("Error updating client status:", error);
        res.status(500).json({ message: "Failed to update client status" });
    }
};

// Verify/Reject company verification
exports.verifyCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'" });
        }

        const client = await db.models.User.findOne({
            where: { id, role: "Client" },
            include: [db.models.CompanyDetails]
        });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        if (!client.CompanyDetail) {
            return res.status(400).json({ message: "Client does not have company details" });
        }

        const updateData = {
            is_verified: action === 'approve',
            is_verified_at: action === 'approve' ? new Date() : null,
            reason: action === 'reject' ? reason : null
        };

        await client.CompanyDetail.update(updateData);

        res.json({
            message: `Company verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            client: client
        });
    } catch (error) {
        console.error("Error updating company verification:", error);
        res.status(500).json({ message: "Failed to update company verification" });
    }
};

// Delete client
exports.deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await db.models.User.findOne({
            where: { id, role: "Client" },
            include: [db.models.CompanyDetails]
        });

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Delete company details first if exists
        if (client.CompanyDetail) {
            await client.CompanyDetail.destroy();
        }

        // Delete user
        await client.destroy();

        res.json({
            message: "Client deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ message: "Failed to delete client" });
    }
};

// Bulk update clients (status, verification)
exports.bulkUpdateClients = async (req, res) => {
    try {
        const { clientIds, action, data } = req.body;

        if (!Array.isArray(clientIds) || clientIds.length === 0) {
            return res.status(400).json({ message: "No clients selected" });
        }

        const allowedActions = ['status', 'verification'];
        if (!allowedActions.includes(action)) {
            return res.status(400).json({ message: "Invalid action" });
        }

        const results = {
            updated: [],
            failed: []
        };

        for (const clientId of clientIds) {
            try {
                const client = await db.models.User.findOne({
                    where: { id: clientId, role: "Client" },
                    include: [db.models.CompanyDetails]
                });

                if (!client) {
                    results.failed.push({ id: clientId, reason: "Client not found" });
                    continue;
                }

                if (action === 'status') {
                    await client.update({ status: data.status });
                } else if (action === 'verification') {
                    if (client.CompanyDetail) {
                        await client.CompanyDetail.update({
                            is_verified: data.is_verified,
                            is_verified_at: data.is_verified ? new Date() : null,
                            reason: data.reason || null
                        });
                    }
                }

                results.updated.push(clientId);
            } catch (error) {
                console.error(`Error updating client ${clientId}:`, error);
                results.failed.push({ id: clientId, reason: error.message });
            }
        }

        res.json({
            message: `Bulk update completed. Updated: ${results.updated.length}, Failed: ${results.failed.length}`,
            results
        });
    } catch (error) {
        console.error("Error in bulk update:", error);
        res.status(500).json({ message: "Failed to perform bulk update" });
    }
};
