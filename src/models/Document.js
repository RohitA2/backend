const { sequelize } = require("../config/database"); // Correct path to sequelize instance
const { DataTypes } = require("sequelize");

const Document = sequelize.define(
  "Document",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    image: {
      type: DataTypes.TEXT, // stores base64 string
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "Document",
    timestamps: true,
  }
);
module.exports = Document;
