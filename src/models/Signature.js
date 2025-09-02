const { sequelize } = require("../config/database"); // Correct path to sequelize instance
const { DataTypes } = require("sequelize");

const Signature = sequelize.define(
  "Signature",
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
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "Signature",
    timestamps: true,
  }
);
module.exports = Signature;
