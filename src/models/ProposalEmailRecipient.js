const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const ProposalEmailRecipient = sequelize.define(
  "ProposalEmailRecipient",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    proposalEmailId: { type: DataTypes.INTEGER },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recipientName: { type: DataTypes.STRING },
    recipientEmail: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM("pending", "sent", "failed"),
      defaultValue: "pending",
    },
    sentAt: { type: DataTypes.DATE },
    errorMessage: { type: DataTypes.TEXT },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "proposal_email_recipients",
    underscored: true,
    timestamps: true,
  }
);

module.exports = ProposalEmailRecipient;
