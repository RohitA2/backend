const bcrypt = require("bcryptjs");
const db = require("../config/database");
const User = db.models.User;
const { sendUserCredentialsMail } = require("../utils/sendMail");
const { where } = require("sequelize");

/**
 * CREATE USER + SEND EMAIL
 */
exports.createUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            role,
            companyId,
            companyName,
            mobile_number,
            gender,
            country,
            state,
            city,
            status,
        } = req.body;

        // Check existing email
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // 🔥 Keep original password for email
        const originalPassword = password;

        // Hash password for DB
        const hashedPassword = password
            ? await bcrypt.hash(password, 10)
            : null;

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            companyId,
            companyName,
            mobile_number,
            gender,
            country,
            state,
            city,
            status,
        });

        // 📧 Send Email AFTER successful creation
        await sendUserCredentialsMail({
            to: email,
            name: `${firstName || ""} ${lastName || ""}`,
            email,
            password: originalPassword, // 👈 plain password
            companyName,
        });

        res.status(201).json({
            success: true,
            message: "User created & credentials sent via email",
            data: user,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create user" });
    }
};


/**
 * GET ALL USERS
 */
exports.getUsers = async (req, res) => {
    const companyId = req.params.id;
    //   console.log(
    //     "🚀 ~ file: employe.controller.js ~ getUsers ~ companyId:",
    //     companyId
    //   );

    try {
        const users = await User.findAll({
            where: { companyId }, // ✅ correct column
            order: [["createdAt", "DESC"]],
        });

        return res.json({
            success: true,
            data: users,
        });
    } catch (err) {
        console.error("❌ Failed to fetch users:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};


/**
 * GET USER BY ID
 */
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user" });
    }
};

/**
 * UPDATE USER
 */
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const payload = { ...req.body };

        // Hash password if present
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 10);
        }

        await user.update(payload);

        res.json({
            success: true,
            message: "User updated successfully",
            data: user,
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to update user" });
    }
};

/**
 * DELETE USER
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.destroy();

        res.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete user" });
    }
};


exports.getProposalsByCompanyId = async (req, res) => {
  try {
    // ✅ FIX 1
    const companyId = req.params.companyId;
    // console.log("Company ID:", companyId);

    const parents = await db.models.Parent.findAll({
      where: { companyId },
      attributes: ["id", "title","user_id"],
      include: [
        {
          model: db.models.ProposalEmail,
          as: "proposals",
          attributes: [
            "id",
            "proposal_name",
            "from_name",
            "from_email",
            "expiration_date",
            "link",
            "created_at",
          ],
          include: [
            // 🟢 Sender
            {
              model: db.models.User, // ✅ FIX 2
              as: "user",
              attributes: ["id", "firstName", "lastName", "email"],
            },

            // 🟢 Recipients
            {
              model: db.models.ProposalEmailRecipient,
              as: "recipients",
              attributes: [
                "recipient_name",
                "recipient_email",
                "status",
                "sent_at",
              ],
            },

            // 🟢 Signatures
            {
              model: db.models.Signature,
              as: "signatures",
              attributes: [
                "status",
                "method",
                "comment",
                "declinedAt",
                "createdAt",
              ],
              required: false,
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: parents,
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

