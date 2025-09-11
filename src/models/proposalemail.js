const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const ProposalEmail = sequelize.define(
  "ProposalEmail",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    headerIds: {
      type: DataTypes.TEXT,
    },
    userId: {
      type: DataTypes.INTEGER,
    },
    proposalName: {
      type: DataTypes.STRING,
    },
    fromName: {
      type: DataTypes.STRING,
    },
    fromEmail: {
      type: DataTypes.STRING,
    },
    expirationDate: {
      type: DataTypes.DATE,
    },
    link: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "proposal_emails",
    underscored: true,
    timestamps: true,
  }
);

module.exports = ProposalEmail;
