// controllers/adminController.js (or wherever your allUser is located)
const db = require("../config/database");

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
        const validStatuses = ["Active", "Inactive", "Pending"];
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