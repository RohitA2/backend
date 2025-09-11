const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const PdfBlock = sequelize.define(
  "PdfBlock",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    blockId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pdf: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.STRING, // Changed to STRING for flexibility
      allowNull: true,
    },
  },
  {
    tableName: "PdfBlock",
    timestamps: true,
  }
);
module.exports = PdfBlock;
