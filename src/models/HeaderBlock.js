// models/HeaderBlock.js
const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const HeaderBlock = sequelize.define(
  "HeaderBlock",
  {
    id: {
      type: DataTypes.TEXT, // Changed to STRING to match frontend block.id
      primaryKey: true,
    },
    logoUrl: {
      type: DataTypes.TEXT, // Changed to TEXT for longer URLs
      allowNull: true,
    },
    backgroundImage: {
      type: DataTypes.TEXT, // Changed to TEXT for longer URLs
      allowNull: true,
    },
    backgroundColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    textColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "Sales Proposal",
    },
    subtitle: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "Optional",
    },
    clientName: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "clientName",
    },
    senderName: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "senderName",
    },
    styles: {
      type: DataTypes.JSONB, // Store all styling and layout data
      allowNull: true,
      defaultValue: {},
    },
    userId: {
      type: DataTypes.STRING, // Changed to STRING for flexibility
      allowNull: true, // Made optional for now
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    layoutType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    layoutStyles: {
      type: DataTypes.JSONB, // Store all styling and layout data
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "HeaderBlock",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["id"],
      },
    ],
  }
);

module.exports = HeaderBlock;
