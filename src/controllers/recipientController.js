const { where } = require("sequelize");
const db = require("../config/database");
const myServices = require("../services/myServices");

exports.createRecipient = async (req, res) => {
  const response = await myServices.create(db.models.Recipient, req.body);
  res.json(response);
};

exports.getRecipient = async (req, res) => {
  const response = await myServices.read(db.models.Recipient, req.params.id);
  res.json(response);
};

exports.updateRecipient = async (req, res) => {
  const response = await myServices.update(
    db.models.Recipient,
    req.params.id,
    req.body
  );
  res.json(response);
};

exports.deleteRecipient = async (req, res) => {
  const response = await myServices.delete(db.models.Recipient, req.params.id);
  res.json(response);
};

// recipient list where userId = req.user.id
exports.listRecipients = async (req, res) => {
  try {
    const { user_id } = req.query;

    // console.log("user_id:", user_id);
    

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const recipients = await db.models.Recipient.findAll({
      where: { user_id },
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      count: recipients.length,
      data: recipients,
    });
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};