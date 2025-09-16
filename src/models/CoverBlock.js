const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");
const CoverBlock = sequelize.define(
  "CoverBlock",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    parentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    blockId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "cover_blocks",
    timestamps: true,
  }
);

module.exports = CoverBlock;
