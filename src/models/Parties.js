const { sequelize } = require("../config/database"); // Correct path to sequelize instance
const { DataTypes } = require("sequelize");

const Parties = sequelize.define(
  "Parties",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    blockId:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    toParty: {
      type: DataTypes.JSONB, // ✅ JSON column in Postgres
      allowNull: true,
    },
    fromParty: {
      type: DataTypes.JSONB, // ✅ JSON column in Postgres
      allowNull: true,
    },
     parentId: {
      type: DataTypes.STRING, // Changed to STRING for flexibility
      allowNull: true,
    },
  },
  {
    tableName: "Parties",
    timestamps: true,
  }
);
module.exports = Parties;
